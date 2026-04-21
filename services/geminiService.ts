import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AppStyle, BackgroundStyle, ClothingChoice, ClothingStyle, GenerationSettings, TieColor, BodyPose, Expression, LightingOption, Wardrobe, PersonType, DoctorCoatColor, StethoscopePosition } from "../types";

/**
 * Service to handle Gemini API interactions for image generation and verification.
 */
export class GeminiService {
  /**
   * Helper to execute Gemini calls with exponential backoff retry logic and timeout.
   */
  private static async withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3, timeoutMs: number = 100000): Promise<T> {
    let lastError: any;
    // Increase retries for 503 (high demand) to be more resilient
    const actualMaxRetries = maxRetries; 
    
    for (let i = 0; i <= actualMaxRetries; i++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Request timed out")), timeoutMs)
        );
        return await Promise.race([fn(), timeoutPromise]);
      } catch (error: any) {
        lastError = error;
        const status = error?.status || error?.code;
        const isRetryable = status === 429 || status === 500 || status === 503 || 
                           error?.message?.includes('exhausted') || 
                           error?.message?.includes('demand') ||
                           error?.message?.includes('timed out') ||
                           error?.message?.includes('fetch') ||
                           error?.name === 'AbortError';
        
        // If it's a 503, we can try even more times (up to 5 total attempts)
        const currentMaxRetries = status === 503 ? 4 : actualMaxRetries;

        if (isRetryable && i < currentMaxRetries) {
          // For 503 (high demand), use a progressively longer delay
          const baseDelay = status === 503 ? 3000 : 1500;
          const delay = Math.pow(2, i) * baseDelay + Math.random() * 2000;
          console.warn(`Gemini API error (${status || 'Timeout'}). Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${currentMaxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  /**
   * Verifies the count of humans in the image to ensure exactly one person is present.
   * Returns 'ZERO', 'ONE', or 'MULTIPLE'.
   */
  static async verifyHumanCount(base64Image: string): Promise<'ZERO' | 'ONE' | 'MULTIPLE'> {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    try {
      const [header, data] = base64Image.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';

      const response = await this.withRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data, mimeType } },
            { text: "Examine this image. How many clearly visible human beings are in this photo? Reply with exactly one word: 'ZERO', 'ONE', or 'MULTIPLE'." }
          ]
        },
      }));
      const text = response.text?.trim().toUpperCase() || '';
      if (text.includes('MULTIPLE')) return 'MULTIPLE';
      if (text.includes('ONE')) return 'ONE';
      return 'ZERO';
    } catch (e) {
      console.error("Verification failed", e);
      return 'ONE'; // Graceful fallback to allow user to proceed
    }
  }

  /**
   * Generates a professional headshot from an uploaded image.
   */
  static async transformImage(
    base64Image: string,
    settings: GenerationSettings,
    highRes: boolean = false,
    seed?: number,
    isThumbnail: boolean = false
  ): Promise<string> {
    // Always prefer the user-selected API key (process.env.API_KEY) for paid models like 3.1
    // GEMINI_API_KEY is the platform's free key which may not have access to paid image models.
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please select a key from a paid project.");
    }
    const ai = new GoogleGenAI({ apiKey: apiKey as string });
    // Use 3.1 for both to ensure consistency between preview and master
    // Use 2.5 for free thumbnails
    const primaryModel = 'gemini-3.1-flash-image-preview';
    const fallbackModel = 'gemini-2.5-flash-image';
    
    const stylePrompts: Record<AppStyle, string> = {
      [AppStyle.AUTO]: "High-authority, clean executive appearance with strong, confident lighting.",
      [AppStyle.CORPORATE_EXECUTIVE]: "High-authority, clean executive appearance with strong, confident lighting.",
      [AppStyle.CREATIVE_PROFESSIONAL]: "Artistic but clean lighting, expressive and modern creative look.",
      [AppStyle.FORMAL_BUSINESS]: "Traditional high-formality corporate look, very professional and neat.",
      [AppStyle.SMART_CASUAL]: "Competent and approachable modern workplace look.",
    };

    const backgroundPrompts: Record<BackgroundStyle, string> = {
      [BackgroundStyle.AUTO]: "on a professional, high-end studio background that best complements the subject's appearance.",
      [BackgroundStyle.PURE_WHITE]: "on an absolute #FFFFFF pure white background with zero shadows.",
      [BackgroundStyle.TRANSPARENT]: "The subject must be perfectly isolated with NO background. The background must be completely transparent (alpha channel). This is a background removal task; ensure the output is a transparent PNG with only the person visible and no pixels in the background area. There should be no white or colored background behind the subject.",
      [BackgroundStyle.ORIGINAL]: "Keep the EXACT background from the source image. Do not modify, blur, or replace the background. The person should be integrated naturally into the original setting.",
      [BackgroundStyle.SOFT_GREY]: "on a professional soft grey studio background with elegant, diffused lighting.",
      [BackgroundStyle.LIGHT_GRAY]: "on a professional light gray studio background with soft, clean lighting.",
      [BackgroundStyle.SLATE_GRAY]: "on a professional slate gray studio background with soft, clean lighting.",
      [BackgroundStyle.OFFICE_BLUR]: "in a high-end modern office with deep cinematic bokeh blur.",
      [BackgroundStyle.PLAIN_WHITE]: "on a simple and professional plain white background.",
      [BackgroundStyle.DEEP_BLUE]: "on a rich, solid deep modern royal blue studio background.",
      [BackgroundStyle.FOREST_GREEN]: "on a sophisticated classic forest green studio backdrop.",
      [BackgroundStyle.NATURE]: "Natural daylight, soft outdoor blur.",
      [BackgroundStyle.NAVY_BLUE]: "on a professional navy blue studio background.",
      [BackgroundStyle.BURGUNDY]: "on an elegant, deep burgundy or maroon studio background.",
      [BackgroundStyle.MOCHA]: "on a warm, professional mocha brown studio background.",
      [BackgroundStyle.DEEP_TEAL]: "on a professional, sophisticated deep teal-colored studio background.",
      [BackgroundStyle.CHARCOAL_TEXTURED]: "on a dark, textured charcoal grey studio background with subtle mottling and professional lighting.",
      [BackgroundStyle.WARM_SPOTLIGHT]: "on a warm grey studio background with a soft, elegant spotlight effect behind the subject.",
      [BackgroundStyle.WARM_ABSTRACT]: "on a warm, artistic abstract studio background with soft textures and a blend of warm earth tones like tan, mocha, and soft grey.",
      [BackgroundStyle.HOSPITAL]: "Clean medical facility environment.",
      [BackgroundStyle.CUSTOM]: `on a solid professional studio background with exact hex color ${settings.customBackgroundHex}. Ensure the lighting is adjusted to look natural against this specific color.`,
      [BackgroundStyle.ALL]: "CRITICAL INSTRUCTION: Generate a 2x2 photo grid (collage) of the same person (2 columns, 2 rows). Top row (left to right): 1. Charcoal Textured. 2. Soft Grey. Bottom row (left to right): 3. Office Blur. 4. Warm Abstract. MANDATORY: Clearly write the exact text of the background type (\"CHARCOAL\", \"SOFT GREY\", \"OFFICE BLUR\", \"WARM ABSTRACT\") in very small, subtle, clean typography at the bottom center of each respective image panel. Do not use giant or oversized text."
    };

    const lightingPrompt = "Apply professional Butterfly lighting (Paramount lighting), creating a small shadow under the nose and evenly illuminating both sides of the face for a high-fashion, symmetrical look.";

    const getClothingPrompt = () => {
      if (settings.wardrobe === Wardrobe.ORIGINAL || settings.clothingChoice === ClothingChoice.ORIGINAL) return "Keep original clothing.";
      
      const colorMap: Record<ClothingStyle, string> = {
        [ClothingStyle.AUTO]: "professional business color",
        [ClothingStyle.NAVY_BLUE]: "navy blue",
        [ClothingStyle.CHARCOAL_GRAY]: "charcoal gray",
        [ClothingStyle.BLACK]: "black",
        [ClothingStyle.LIGHT_GRAY]: "light gray",
        [ClothingStyle.TEXTURED_BLUE]: "textured blue",
        [ClothingStyle.OLIVE_GREEN]: "olive green",
        [ClothingStyle.BURGUNDY]: "deep burgundy",
        [ClothingStyle.DARK_BROWN]: "dark brown",
        [ClothingStyle.TAN_BEIGE]: "tan / beige",
        [ClothingStyle.SLATE_GRAY]: "slate gray",
        [ClothingStyle.CUSTOM]: "custom color",
      };
      
      const color = settings.useCustomSuitColor 
        ? `custom color (hex: ${settings.customSuitHex})` 
        : colorMap[settings.clothingStyle];
      
      let tieColorStr = settings.tieColor === TieColor.AUTO ? "matching" : settings.tieColor.toLowerCase();
      if (settings.useCustomTieColor) {
        tieColorStr = `custom color (hex: ${settings.customTieHex})`;
      }

      if (settings.wardrobe === Wardrobe.CORPORATE) {
        switch (settings.clothingChoice) {
          case ClothingChoice.SUIT_AND_TIE: 
          case ClothingChoice.AUTO: return `wearing a premium ${color} suit, white shirt, and a ${tieColorStr} professional tie.`;
          case ClothingChoice.SUIT_ONLY: return `wearing a premium ${color} suit jacket and open-collar white shirt.`;
          case ClothingChoice.SHIRT_ONLY:
          case ClothingChoice.NO_SUIT_NO_TIE: return `wearing a crisp ${color} professional shirt.`;
          default: return `wearing a premium ${color} suit, white shirt, and a ${tieColorStr} professional tie.`;
        }
      } else if (settings.wardrobe === Wardrobe.LINKEDIN) {
        switch (settings.clothingChoice) {
          case ClothingChoice.SUIT_AND_TIE: 
          case ClothingChoice.AUTO: return `wearing a premium ${color} suit, white shirt, and a ${tieColorStr} professional tie, maintaining a professional yet relaxed look.`;
          case ClothingChoice.SUIT_ONLY: return `wearing a premium ${color} suit jacket and open-collar white shirt, maintaining a professional yet relaxed look.`;
          case ClothingChoice.SHIRT_ONLY:
          case ClothingChoice.NO_SUIT_NO_TIE: return `wearing a crisp ${color} professional shirt only, maintaining a professional yet relaxed look.`;
          default: return `wearing a premium ${color} suit, white shirt, and a ${tieColorStr} professional tie, maintaining a professional yet relaxed look.`;
        }
      } else if (settings.wardrobe === Wardrobe.CREATIVE) {
        const gender = settings.personType === PersonType.AUTO ? 'gender-matching' : (settings.personType === PersonType.MALE ? 'male' : (settings.personType === PersonType.FEMALE ? 'female' : 'unisex'));
        return `wearing stylish, artistic, or unique ${gender} creative professional attire in a ${color} tone.`;
      } else if (settings.wardrobe === Wardrobe.DOCTOR) {
        const coatColor = settings.doctorCoatColor === DoctorCoatColor.WHITE ? "white" : "green uniform";
        const stethoscope = settings.stethoscopePosition === StethoscopePosition.NECK 
          ? "with a stethoscope draped professionally around the neck" 
          : "holding a stethoscope in one hand";
        return `wearing a medical professional ${coatColor} coat ${stethoscope} over a randomly selected light-colored shirt.`;
      } else if (settings.wardrobe === Wardrobe.LAWYER) {
        const coat = settings.enableBlackCoat ? "a professional Lawyer's Black Coat/Blazer" : "professional attire";
        const band = settings.enableNeckBand ? "and a White Neckband" : "";
        return `wearing ${coat}, a White Shirt, ${band}.`;
      } else if (settings.wardrobe === Wardrobe.ALL) {
        return `CRITICAL INSTRUCTION: Generate a 2x2 photo grid (collage) of the same person (2 columns, 2 rows). Top row (left to right): 1. Corporate suit and tie. 2. Creative stylish attire. Bottom row (left to right): 3. Doctor's white coat. 4. LinkedIn relaxed professional. MANDATORY: Clearly write the exact text of the portrait type ("CORPORATE", "CREATIVE", "DOCTOR", "LINKEDIN") in very small, subtle, clean typography at the bottom center of each respective image panel. Do not use giant or oversized text.`;
      }
      
      return "";
    };

    const getBeautyPrompt = () => {
      let prompt = "";
      if (settings.beautyFilter > 0) {
        prompt += `Apply a professional beauty enhancement (level ${settings.beautyFilter}/100), enhancing natural skin radiance with realistic subsurface scattering for a vibrant, healthy skin glow while strictly maintaining original skin tones. Ensure the face looks lively and naturally brightened with professional studio luminosity. `;
      }
      if (settings.smoothing > 0) {
        prompt += `Apply professional face smoothing (level ${settings.smoothing}/100) to reduce blemishes. CRITICAL: The skin MUST maintain ultra-realistic micro-textures, pores, and fine details. It should NOT look waxy or "plastic". `;
      } else {
        prompt += "Maintain ultra-realistic natural skin micro-textures, pores, and fine details with natural skin translucency and organic imperfections for maximum realism. ";
      }

      if (settings.eyeEnhancement) {
        prompt += "Apply professional eye enhancement: sharpen the iris, enhance natural catchlights for a vibrant, 'alive' look, and ensure the eyes look bright, clear, and full of life. ";
      }
      
      // Face Lighting / Fill Light logic
      const leftLighting = settings.faceLeftLighting ?? 50;
      const rightLighting = settings.faceRightLighting ?? 50;
      prompt += `Apply precise studio lighting control: Face(Left) Lighting at ${leftLighting}/100 and Face(Right) Lighting at ${rightLighting}/100. Use soft, wrap-around light to eliminate dullness and create a vibrant, high-end professional look. The illumination must be flattering, preserving natural facial contours while ensuring the face looks bright and energetic. `;
      
      if (settings.enableAdditionalSettings) {
        // Additional Settings
        if (settings.enableFairness) {
          prompt += "Apply subtle professional skin brightening and radiance enhancement while strictly maintaining the subject's natural skin tone. ";
        }
        if (settings.enableFaceSmoothing) {
          prompt += "Apply professional face smoothing while maintaining natural micro-textures. ";
        }
        if (settings.enableBeautification) {
          prompt += "Apply a general professional beautification filter, enhancing facial vitality and brightness. ";
        }
      }

      prompt += "CRITICAL: The generated portrait MUST maintain a 100% accurate resemblance to the person in the source image. ";
      
      return prompt;
    };

    const getPosePrompt = () => {
      let prompt = "";
      if (settings.bodyPose === BodyPose.AUTO) {
        prompt += "Use a professional, standard head-and-shoulders framing that best suits the subject.";
      } else if (settings.bodyPose === BodyPose.FULL_FRONT) {
        prompt += "Generate a straight-on, full front-facing view. The subject's body and face must point directly at the camera. The framing MUST crop exactly at the mid-torso/waist level (blue line framing).";
      } else if (settings.bodyPose === BodyPose.SIDE_FRONT) {
        prompt += "CRITICAL: Generate a side-angled view (3/4 profile). The subject's body and head MUST be turned slightly to the side, while their eyes look directly at the camera. Do NOT generate a straight-on full front view. The framing MUST crop exactly at the mid-torso/waist level (blue line framing).";
      } else if (settings.bodyPose === BodyPose.ZOOM_VIEW || settings.bodyPose === BodyPose.CLOSE_UP) {
        prompt += "Generate a tight front-facing view. The framing MUST crop exactly just below the shoulders/upper-chest level (red line framing), focusing heavily on the face.";
      } else if (settings.bodyPose === BodyPose.THREE_QUARTER) {
        prompt += "Generate a professional three-quarter length portrait. The framing MUST crop exactly at the mid-thigh or knee level (green line framing), showing more of the body.";
      }
      return prompt;
    };

    let mouthControl = "Maintain the subject's natural mouth expression.";
    if (settings.enableSmile) {
      if (settings.expression === Expression.PROFESSIONAL) {
        mouthControl = "A confident, pleasant professional smile is requested. A very slight, subtle hint of teeth may be visible, keeping the expression warm and approachable.";
      } else if (settings.expression === Expression.WARM_SMILE) {
        mouthControl = "A warm, approachable, open smile is requested. Show a natural, moderate amount of teeth, ensuring the eyes also reflect the warmth of the smile.";
      }
    } else {
      mouthControl = "A pleasant, neutral-positive, and approachable expression is requested. The subject should look friendly, competent, and energetic, NOT sad, dull, or overly serious. Keep the mouth naturally relaxed with a hint of a 'soft smile' in the eyes (smize). The overall vibe should be highly professional yet welcoming.";
    }

    const prompt = `
      CRITICAL INSTRUCTION: Follow the requested facial expression carefully.
      
      SUBJECT DETAILS:
      - Person Type: ${settings.personType === PersonType.AUTO ? 'Keep exact gender/identity from source image' : settings.personType}
      - Pose Angle: ${settings.bodyPose}
      - Wardrobe Style: ${settings.wardrobe}
      - Smile Enabled: ${settings.enableSmile}
      - Base Expression: ${settings.enableSmile ? settings.expression : 'Natural/Serious'}
      - Overall Style: ${stylePrompts[settings.style]}

      1. MOUTH & TEETH CONTROL (HIGHEST PRIORITY): 
         - ${mouthControl}
      
      2. HEAD & FACE ORIENTATION (MANDATORY): 
         - ${getPosePrompt()}
         - Re-orient the head and body as requested while maintaining facial identity.
      
      3. ARM & HAND POSTURE (STRICT): 
         - ABSOLUTELY NO HANDS, PHONES, OR GESTURES.
         - Remove any hands visible in the frame, including hands holding phones, making signs (like peace signs), or touching the face.
         - The subject's arms MUST be in a natural, professional downward position at their sides (out of frame or resting naturally).
         - The shoulders should follow the requested orientation, but the arms must be relaxed and down.
      
      4. IDENTITY & EXPRESSION (HIGHEST PRIORITY): 
         - Maintain 100% anatomical facial likeness, bone structure, and unique features from the source image.
         - The person in the generated image must be UNMISTAKABLY the same person as in the source photo.
         - ${getBeautyPrompt()}
      
      5. PROFESSIONAL UPGRADE (QUALITY ONLY): 
         - ${lightingPrompt} The lighting must be balanced across the face, ensuring both sides are clearly visible with minimal contrast difference (10-20% max).
         - Use high-end studio lighting (Rembrandt or Butterfly) to create depth and professional dimension.
         - Replace the background with: ${backgroundPrompts[settings.background]}
         - Replace the clothing with: ${getClothingPrompt()}
      
      6. COMPOSITION & QUALITY: 3:4 Vertical framing. ${settings.wardrobe === Wardrobe.ALL ? 'Generate a 2x2 grid collage of 4 distinct professional outfits.' : settings.background === BackgroundStyle.ALL ? 'Generate a 2x2 grid collage of 4 distinct professional backgrounds.' : (settings.bodyPose === BodyPose.ZOOM_VIEW || settings.bodyPose === BodyPose.CLOSE_UP ? 'Tight head and shoulders professional studio portrait. The bottom of the frame MUST crop just below the shoulders/upper-chest (red line framing).' : settings.bodyPose === BodyPose.THREE_QUARTER ? 'Three-quarter length professional studio portrait. The bottom of the frame MUST crop at the mid-thigh or knee level (green line framing).' : 'Medium shot (waist-up) professional studio portrait. The bottom of the frame MUST crop at the mid-torso or waist level (blue line framing), showing the full torso and shoulders clearly.')} This specific framing is MANDATORY for the selected pose. Maintain significant headroom (empty space) above the top of the head. Zeiss 85mm rendering with soft background falloff. Medium format camera aesthetic (Phase One XF quality).
      
      7. EXTREME DETAIL & CLARITY (MANDATORY): 
         - ${settings.smoothing > 30 ? 'Clean, polished skin appearance with natural luminosity.' : 'Lifelike skin with visible fine pores, ultra-realistic micro-textures, and natural skin translucency.'}
         - Sharp focus on the eyes with vibrant, elegant catchlights.
         - High-resolution fabric textures in clothing (wool, silk, cotton).
         - Professional color grading with natural, healthy skin tones. Avoid any unnatural skin whitening, artificial color shifts, or oversaturation. The skin tone must be 100% natural and consistent with the source image, but enhanced with a professional studio-lit glow and natural subsurface scattering. Ensure the face color and skin tone are perfectly matched to the subject's original complexion with a high-end, professional finish.
         - NO airbrushing unless specified by smoothing levels.
         - The final output must have the clarity and detailing of a high-end 8k professional studio photograph.
      
      8. NEGATIVE CONSTRAINTS (STRICT):
         - NO SAD, DEPRESSED, OR OVERLY SERIOUS EXPRESSIONS.
         - NO DULL, FLAT, OR UNDEREXPOSED LIGHTING.
         - NO WAXY, PLASTIC, OR ARTIFICIALLY SMOOTHED SKIN.
         - NO EXAGGERATED GRINS OR OVERLY WIDE MOUTHS.
         - NO DISTORTED TEETH.
         - NO OPEN MOUTHS. NO PARTED LIPS (unless specified by smile settings).
         - NO HANDS, FINGERS, OR GESTURES.
         - NO PHONES OR ACCESSORIES.
         - NO GLASSES (unless in source).
         - NO DISTORTED FACIAL FEATURES.
         - NO BLURRY OR LOW-RESOLUTION OUTPUT.
    `;

    try {
      const startTime = Date.now();
      console.log(`>>> Starting Gemini Image Generation (${primaryModel})...`, { isThumbnail, highRes, seed });
      
      const [header, data] = base64Image.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
      
      const executeGeneration = async (model: string) => {
        const config: any = {
          imageConfig: { 
            aspectRatio: "3:4"
          }
        };

        if (model === primaryModel) {
          config.imageConfig.imageSize = isThumbnail ? "512px" : (highRes ? "2K" : "1K");
        }

        return await ai.models.generateContent({
          model: model,
          contents: {
            parts: [{ inlineData: { data, mimeType } }, { text: prompt }]
          },
          config
        });
      };

      let response: GenerateContentResponse;
      try {
        // Try primary model with retries
        response = await this.withRetry(() => executeGeneration(primaryModel));
      } catch (primaryError: any) {
        const status = primaryError?.status || primaryError?.code;
        const errMsg = primaryError?.message || '';
        // If primary model is unavailable (503), overloaded (429), or unauthorized (403/not found), try fallback model
        if (status === 503 || status === 429 || status === 403 || errMsg.includes('demand') || errMsg.includes('not found') || errMsg.includes('permission denied')) {
          console.warn(`Primary model (${primaryModel}) failed with ${status || errMsg}. Attempting fallback to ${fallbackModel}...`);
          // Try fallback model with its own retries
          response = await this.withRetry(() => executeGeneration(fallbackModel));
        } else {
          throw primaryError;
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      console.log(`>>> Gemini API call completed in ${duration.toFixed(2)}s`);

      for (const cand of response.candidates || []) {
        if (cand.finishReason === 'SAFETY') {
          throw new Error("The image could not be generated due to safety filters. Please try a different photo.");
        }
        for (const part of cand.content.parts) {
          if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("The AI was unable to produce an image. This can happen with very complex photos. Please try again.");
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
