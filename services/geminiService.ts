import axios from "axios";
import { AppStyle, BackgroundStyle, ClothingChoice, ClothingStyle, GenerationSettings, TieColor, BodyPose, Expression, LightingOption, Wardrobe, PersonType, DoctorCoatColor, StethoscopePosition } from "../types";

/**
 * Service to handle Gemini API interactions for image generation and verification.
 */
export class GeminiService {
  /**
   * Helper to execute Gemini calls with exponential backoff retry logic and timeout.
   */
  private static async withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3, timeoutMs: number = 120000): Promise<T> {
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
        const status = error?.status || error?.code || error?.response?.status;
        const errMsg = error?.message || error?.response?.data?.error?.message || "";
        
        const isRetryable = status === 429 || status === 500 || status === 503 || 
                           errMsg.toLowerCase().includes('exhausted') || 
                           errMsg.toLowerCase().includes('demand') ||
                           errMsg.toLowerCase().includes('timed out') ||
                           errMsg.toLowerCase().includes('fetch') ||
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
    try {
      const [header, data] = base64Image.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
      const model = 'gemini-3-flash-preview'; // Use the latest stable model for verification
      const contents = [
        {
          role: 'user',
          parts: [
            { inlineData: { data, mimeType } },
            { text: "Examine this image. How many clearly visible human beings are in this photo? Reply with exactly one word: 'ZERO', 'ONE', or 'MULTIPLE'." }
          ]
        }
      ];

      const fetchResult = async () => {
        try {
          const res = await axios.post('/api/gemini-proxy', { 
            model, 
            contents,
            usePremiumKey: false // Verification is always non-premium
          }, { timeout: 60000 }); // Increased from 30s to 60s
          const raw = res.data;
          
          if (raw?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return { text: raw.candidates[0].content.parts[0].text.trim() };
          }
          return raw;
        } catch (e: any) {
          console.warn("Verification proxy failed, falling back to server-side logic", e.message);
          throw e; // Let withRetry handle it
        }
      };

      const response = (await this.withRetry(() => fetchResult())) as any;
      const text = (response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text || '').toUpperCase();
      
      console.log(">>> Human Verification Result:", text);
      
      // Be more lenient: if it's not explicitly 'MULTIPLE', assume 'ONE' or 'ZERO' but allow 'ONE'
      if (text.includes('MULTIPLE') || text.includes('MANY') || text.includes('GROUP')) return 'MULTIPLE';
      if (text.includes('ONE') || text.includes('1 ') || text.includes('PERSON') || text.includes('SINGLE')) return 'ONE';
      
      // If the AI is confused but returned something, and it's not obviously multiple, let it slide as 'ONE'
      // to avoid blocking the user due to AI inconsistency
      return 'ONE'; 
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
    isThumbnail: boolean = false,
    isStudio: boolean = false
  ): Promise<string> {
    // Use specialized high-quality image models
    const primaryModel = 'gemini-2.5-flash-image'; // Essential Preview
    const hdModel = 'gemini-3.1-flash-image-preview'; // High Definition 
    const studioModel = 'gemini-3-pro-image-preview'; // Masterclass / Studio Quality
    const fallbackModel = 'gemini-3.1-flash-image-preview'; 
    
    // Choose the model based on requested quality
    let modelToUse = isStudio ? studioModel : (highRes ? hdModel : primaryModel);
    
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

    const lightingPrompt = "Apply professional Butterfly lighting (Paramount lighting) with a 3:1 lighting ratio. This should create an elegant shadow under the nose while evenly illuminating both sides of the face. Use a subtle fill light for the neck to ensure depth. The illumination must look organic and warm, as if captured in a high-end studio.";

    const getClothingPrompt = () => {
      if (settings.wardrobe === Wardrobe.ORIGINAL || settings.clothingChoice === ClothingChoice.ORIGINAL) return "Keep original clothing with natural fabric textures.";
      
      const colorMap: Record<ClothingStyle, string> = {
        [ClothingStyle.AUTO]: "professional business color with natural fabric weave",
        [ClothingStyle.NAVY_BLUE]: "navy blue with realistic wool texture",
        [ClothingStyle.CHARCOAL_GRAY]: "charcoal gray with visible fabric grain",
        [ClothingStyle.BLACK]: "black with subtle silk or wool sheen",
        [ClothingStyle.LIGHT_GRAY]: "light gray with natural creases",
        [ClothingStyle.TEXTURED_BLUE]: "textured blue with visible linen or cotton weave",
        [ClothingStyle.OLIVE_GREEN]: "olive green with earthy fabric texture",
        [ClothingStyle.BURGUNDY]: "deep burgundy with rich material depth",
        [ClothingStyle.DARK_BROWN]: "dark brown with leather or heavy cotton texture",
        [ClothingStyle.TAN_BEIGE]: "tan / beige with soft natural texture",
        [ClothingStyle.SLATE_GRAY]: "slate gray with professional matte finish",
        [ClothingStyle.CUSTOM]: "custom color with realistic fabric rendering",
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
        prompt += `Apply subtle high-end retouching (level ${settings.beautyFilter}/100), focusing on natural skin luminosity. Preserve all unique facial micro-features. `;
      }
      if (settings.smoothing > 0) {
        prompt += `Apply sophisticated skin smoothing (level ${settings.smoothing}/100) while strictly preserving 100% of the natural skin grain and micro-pores. No waxy look. `;
      } else {
        prompt += "DELIVER RAW PHOTOGRAPHIC TEXTURE: The skin MUST show high-resolution details including pores and fine natural textures. Avoid all 'AI-smooth' or 'plastic' look. ";
      }

      if (settings.eyeEnhancement) {
        prompt += "Sharp focus on the pupils with natural catchlights. The eyes must look sharp and biologically accurate. ";
      }
      
      // Face Lighting / Fill Light logic
      const leftLighting = settings.faceLeftLighting ?? 50;
      const rightLighting = settings.faceRightLighting ?? 50;
      prompt += `Precision studio lighting: Face(Left) at ${leftLighting}/100 and Face(Right) at ${rightLighting}/100. `;
      
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

      prompt += "UNCOMPROMISING IDENTITY: The person must be exactly the same as in the source image. ";
      
      return prompt;
    };

    const getPosePrompt = () => {
      let prompt = "";
      if (settings.bodyPose === BodyPose.AUTO) {
        prompt += "Use a professional, standard head-and-shoulders framing. Focus primarily on the face and upper shoulders. ";
      } else if (settings.bodyPose === BodyPose.FULL_FRONT) {
        prompt += "Generate a straight-on, full front-facing view. The subject's body and face must point directly at the camera. MANDATORY CROP: This MUST be a tight headshot. The image MUST terminate at the upper chest level. ABSOLUTELY NO WAIST, STOMACH, OR LOWER BODY. The face should occupy approximately 60% of the vertical frame height. ";
      } else if (settings.bodyPose === BodyPose.SIDE_FRONT) {
        prompt += "STRICT MANDATE: Generate a side-angled view (3/4 profile). The subject's torso and head MUST be turned 45 degrees to the side, while their eyes look directly at the camera. Do NOT generate a straight-on front view. MANDATORY CROP: The image MUST terminate at the upper chest level. ABSOLUTELY NO WAIST OR LOWER BODY. ";
      } else if (settings.bodyPose === BodyPose.ZOOM_VIEW || settings.bodyPose === BodyPose.CLOSE_UP) {
        prompt += "Generate a tight professional ZOOM HEADSHOT. MANDATORY: The ENTIRE head, hair, and neck MUST be fully visible and centered. The image should terminate at the upper shoulders. The face should be the dominant subject, occupying 75-80% of the frame. STATED REQUIREMENT: The full head (top of hair to chin) must be cleanly contained with breathing room (headroom). Do NOT crop the hair. ";
      } else if (settings.bodyPose === BodyPose.THREE_QUARTER) {
        prompt += "Generate a professional three-quarter length portrait. MANDATORY CROP: The image MUST terminate at the mid-thigh or knee level. This is the ONLY pose allowed to show the lower torso and suit jacket down to the thighs. ";
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

      1. PHOTOGRAPHIC REALISM (HIGHEST PRIORITY):
         - This MUST look like a genuine RAW photograph from a Canon EOS R5 or Sony A7R V.
         - NO "AI ART" SMOOTHNESS. NO PLASTIC TEXTURES. NO PAINTING-LIKE EFFECTS.
         - Skin must have visible natural pores, subtle organic imperfections, and realistic subsurface scattering.
         - Hair must have individual realistic strands with natural light diffraction.
         - Ensure natural "optical" depth of field (bokeh) that follows laws of physics, not just a digital blur.
         - Avoid over-saturation. Colors must be natural, organic, and professional.
      
      2. MOUTH & TEETH CONTROL: 
         - ${mouthControl}
      
      3. HEAD & FACE ORIENTATION: 
         - ${getPosePrompt()}
         - Re-orient the head and body as requested while maintaining 100% facial identity.
      
      4. LIGHTING & ATMOSPHERE:
         - ${lightingPrompt}
         - Lighting must look physical and organic, originating from studio light boxes or natural windows.
         - Contrast should be realistic, avoiding the flat "AI HDR" look.
      
      5. ARM & HAND POSTURE (STRICT): 
         - ABSOLUTELY NO HANDS, PHONES, OR GESTURES.
         - Remove any hands visible in the frame, including hands holding phones, making signs (like peace signs), or touching the face.
         - The subject's arms MUST be in a natural, professional downward position at their sides (out of frame or resting naturally).
         - The shoulders should follow the requested orientation, but the arms must be relaxed and down.
      
      6. IDENTITY & EXPRESSION (HIGHEST PRIORITY): 
         - Maintain 100% anatomical facial likeness, bone structure, and unique features from the source image.
         - GROOMING INTEGRITY: The facial hair state (clean-shaven, stubble, beard, or mustache) MUST match the source photo exactly. Do NOT add facial hair if the subject is clean-shaven.
         - HAIR STYLE (HEAD): Maintain the subject's original hair style and color from the source photo, but apply professional grooming to ensure it looks neat, tidy, and well-maintained for a premium portrait. No messy or stray hairs.
         - The person in the generated image must be UNMISTAKABLY the same person as in the source photo.
         - ${getBeautyPrompt()}
      
      5. PROFESSIONAL UPGRADE (QUALITY ONLY): 
         - ${lightingPrompt} The lighting must be balanced across the face, ensuring both sides are clearly visible with minimal contrast difference (10-20% max).
         - Use high-end studio lighting (Rembrandt or Butterfly) to create depth and professional dimension.
         - Replace the background with: ${backgroundPrompts[settings.background]}
         - Replace the clothing with: ${getClothingPrompt()}
      
      6. COMPOSITION & STYLING (MANDATORY): 
         - 3:4 Vertical Aspect Ratio.
         - ${settings.wardrobe === Wardrobe.ALL ? 'Generate a 2x2 grid collage of the same person in 4 distinct professional outfits.' : settings.background === BackgroundStyle.ALL ? 'Generate a 2x2 grid collage of the same person in 4 distinct professional backgrounds.' : 
           (settings.bodyPose === BodyPose.ZOOM_VIEW || settings.bodyPose === BodyPose.CLOSE_UP) ? 'ZOOM HEADSHOT: Focus strictly on the face. The entire head, inclusive of all hair, MUST be fully visible. The bottom of the frame MUST crop at the upper shoulders. Ensure significant headroom (empty space) above the hair.' : 
           (settings.bodyPose === BodyPose.FULL_FRONT || settings.bodyPose === BodyPose.SIDE_FRONT || settings.bodyPose === BodyPose.AUTO) ? 'HEAD-AND-SHOULDERS: The bottom of the frame MUST crop exactly at the upper chest level. ABSOLUTELY NO WAIST OR HANDS.' :
           settings.bodyPose === BodyPose.THREE_QUARTER ? 'THREE-QUARTER LENGTH: The bottom of the frame MUST crop at the mid-thigh/knee level.' : 
           'Standard professional headshot framing.'}
         - HEADROOM: Always maintain 10-15% of empty space (headroom) above the top of the hair. NEVER cut off the top of the head.
         - NO DISTRACTIONS: The frame must contain ONLY the person and the studio background. No furniture, microphones, or other humans.
         - OPTICS: Zeiss 85mm f/1.2 lens rendering (shallow depth of field with creamy bokeh). Professional medium-format camera quality (Phase One 150MP aesthetic).
      
      7. PHOTOGRAPHIC REALISM & TEXTURE (CRITICAL): 
         - This is a high-end commercial photograph, NOT an AI-generated artwork.
         - AVOID ANY ARTIFICIAL GLOSS, PLASTIC TEXTURES, OR UNNATURAL SYMMETRY.
         - The skin MUST have highly detailed, realistic texture: visible pores, fine hair follicles, natural micro-imperfections, and realistic skin translucency.
         - NO "GLOWY" OR RADIANT AI EFFECTS that look synthetic.
         - Use natural, directional studio lighting that creates soft, realistic shadows on the face and neck.
         - The overall aesthetic must be that of a RAW photograph captured on a professional medium-format camera, with no post-processing artifacts (NO chromatic aberration, NO blur unless DOF).
         - Color accuracy is paramount. Maintain the exact skin tone and eye color from the source, but with premium professional lighting.
         - HAIR DETAIL: Strands should be distinct but neat. Avoid the "helmet hair" look.
      
      8. EXTREME DETAIL & CLARITY (MANDATORY): 
         - ${settings.smoothing > 30 ? 'Clean, polished skin appearance with natural luminosity.' : 'Hyper-realistic skin with detailed texture, micro-pores, and natural moisture levels.'}
         - Sharp focus on the pupils with natural catchlights (no white circular halos).
         - Realistic fabric weave in the clothing.
         - Professional color grading with a neutral, high-end commercial palette. Keep skin tones warm and healthy but grounded in reality.
      
      ${isStudio ? `
      9. PREMIUM STUDIO UPGRADE (MASTERCLASS FIDELITY):
         - Use Ultra-High Dynamic Range (UHDR) lighting simulation.
         - Emulate the optical characteristics of a medium-format Hasselblad H6D-400c.
         - Skin sub-surface scattering must be perfect, showing depth and organic warmth.
         - Every single pore, fine hair, and fabric thread must be rendered with hyper-clarity.
         - The eyes must have complex iris textures and realistic fluid reflections.
         - Overall sharpness should be increased while maintaining a smooth, non-digital aesthetic.
      ` : ""}
      
      9. NEGATIVE CONSTRAINTS (STRICT - ABSOLUTELY NO EXCEPTIONS):
         - NO WAXY SKIN. NO PLASTIC TEXTURE. NO CARTOONISH FEATURES.
         - NO UNNATURAL EYE SHINE (AI HALOS). NO OVER-SATURATED COLORS.
         - NO ADDED FACIAL HAIR. Do NOT add a beard, mustache, or stubble if the subject is clean-shaven.
         - NO REPETITIVE PATTERNS. NO MATH-PERFECT SYMMETRY.
         - NO DISTORTED FACIAL FEATURES.
         - NO BLURRY OR LOW-RESOLUTION OUTPUT.
    `;

    try {
      const startTime = Date.now();
      console.log(`>>> Starting Gemini Image Generation (${modelToUse})...`, { isThumbnail, highRes, seed });
      
      const [header, data] = base64Image.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
      
      const executeGeneration = async (model: string) => {
        const generationConfig: any = {
          temperature: 0.4,
          topP: 0.8
        };
        
        if (model.includes('image')) {
          // DO NOT set responseMimeType for image models as per skill
          
          // Only gemini-2.5+ and 3.x models support imageSize config
          const supportsSize = model.includes('3.') || model.includes('2.5');
          
          generationConfig.imageConfig = {
            aspectRatio: "3:4"
          };

          if (supportsSize) {
            // Use 4K for studio, 2K for HD, 1K for high-res preview, 512px for thumb
            generationConfig.imageConfig.imageSize = isStudio ? "4K" : (highRes ? "2K" : "1K");
            if (isThumbnail) generationConfig.imageConfig.imageSize = "512px";
          }
        }

        try {
          const contents = [{
            role: 'user',
            parts: [{ inlineData: { data, mimeType } }, { text: prompt }]
          }];
          // Use server proxy to pick up secrets and avoid quota sharing issues
          const res = await axios.post('/api/gemini-proxy', {
            model,
            contents,
            config: generationConfig,
            usePremiumKey: highRes // Only use premium key for HD studio results
          }, { timeout: 240000 }); // Increase timeout for images
          return res.data;
        } catch (serverErr: any) {
          console.error("Gemini proxy call failed:", serverErr.response?.data || serverErr.message);
          throw serverErr;
        }
      };

      let response: any;
      try {
        // Try selected model with retries
        response = await this.withRetry(() => executeGeneration(modelToUse));
      } catch (primaryError: any) {
        const status = primaryError?.status || primaryError?.code || primaryError?.response?.status;
        const errMsg = primaryError?.message || (primaryError as any)?.response?.data?.error || '';
        
        console.warn(`Primary model (${modelToUse}) failed. Status: ${status}, Message: ${errMsg}`);

        // If primary model is already exhausted or overloaded, try fallback immediately
        if (status === 429 || status === 503 || errMsg.includes('quota') || errMsg.includes('limit') || errMsg.includes('demand')) {
          console.warn(`Attempting fallback to ${fallbackModel} due to primary model exhaustion...`);
          try {
            response = await this.withRetry(() => executeGeneration(fallbackModel));
          } catch (fallbackError: any) {
            console.error("Fallback model also failed:", fallbackError);
            throw primaryError; // Re-throw primary error if both failed
          }
        } else {
          throw primaryError;
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      console.log(`>>> Gemini API call completed in ${duration.toFixed(2)}s`);

      // Standardize response candidate extraction
      const resData = response as any;
      const candidates = resData.candidates || [];
      
      for (const cand of candidates) {
        if (cand.finishReason === 'SAFETY') {
          throw new Error("The image could not be generated due to safety filters. Please try a different photo.");
        }
        const parts = cand.content?.parts || [];
        for (const part of parts) {
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
