export enum AppStyle {
  AUTO = 'Auto',
  CORPORATE_EXECUTIVE = 'Corporate Executive',
  CREATIVE_PROFESSIONAL = 'Creative Professional',
  FORMAL_BUSINESS = 'Formal Business',
  SMART_CASUAL = 'Smart Casual'
}

export enum BackgroundStyle {
  AUTO = 'Auto',
  PURE_WHITE = 'Pure White',
  TRANSPARENT = 'Transparent',
  ORIGINAL = 'Original',
  SOFT_GREY = 'Soft Grey',
  LIGHT_GRAY = 'Light Gray',
  SLATE_GRAY = 'Slate Gray',
  OFFICE_BLUR = 'Office Blur',
  PLAIN_WHITE = 'Plain White',
  DEEP_BLUE = 'Deep Blue',
  FOREST_GREEN = 'Forest Green',
  NATURE = 'Nature',
  NAVY_BLUE = 'Navy Blue',
  BURGUNDY = 'Burgundy',
  MOCHA = 'Mocha',
  DEEP_TEAL = 'Deep Teal',
  CHARCOAL_TEXTURED = 'Charcoal Textured',
  WARM_SPOTLIGHT = 'Warm Spotlight',
  WARM_ABSTRACT = 'Warm Abstract',
  HOSPITAL = 'Hospital',
  CUSTOM = 'Custom',
  ALL = 'All'
}

export enum ClothingChoice {
  AUTO = 'Auto',
  ORIGINAL = 'Original',
  SUIT_AND_TIE = 'Suit & Tie',
  SUIT_ONLY = 'Suit Only',
  NO_SUIT_NO_TIE = 'No Suit, No Tie',
  SHIRT_ONLY = 'Shirt Only'
}

export enum ClothingStyle {
  AUTO = 'Auto',
  NAVY_BLUE = 'Navy Blue',
  CHARCOAL_GRAY = 'Charcoal Gray',
  BLACK = 'Black',
  LIGHT_GRAY = 'Light Gray',
  TEXTURED_BLUE = 'Textured Blue',
  OLIVE_GREEN = 'Olive Green',
  BURGUNDY = 'Burgundy',
  DARK_BROWN = 'Dark Brown',
  TAN_BEIGE = 'Tan Beige',
  SLATE_GRAY = 'Slate Gray',
  CUSTOM = 'Custom'
}

export enum TieColor {
  AUTO = 'Auto',
  MAROON = 'Maroon',
  NAVY_BLUE = 'Navy Blue',
  ROYAL_GOLD = 'Royal Gold',
  SILVER_SILK = 'Silver Silk',
  SOLID_BLACK = 'Solid Black',
  SKY_BLUE = 'Sky Blue',
  HUNTER_GREEN = 'Hunter Green',
  CUSTOM = 'Custom'
}

export enum BodyPose {
  AUTO = 'Auto',
  FULL_FRONT = 'Full Front',
  SIDE_FRONT = 'Side Front',
  ZOOM_VIEW = 'Zoom View',
  THREE_QUARTER = 'Three Quarter',
  CLOSE_UP = 'Close Up'
}

export enum LightingOption {
  AUTO = 'Auto',
  BUTTERFLY = 'Butterfly',
  STUDIO = 'Studio',
  LOOP = 'Loop',
  REMBRANDT = 'Rembrandt',
  SOFT = 'Soft',
  FLAT = 'Flat'
}

export enum PoseAngle {
  FULL_FRONT = 'Full Front',
  SIDE_FRONT = 'Side Front',
  THREE_QUARTER = 'Three-Quarter',
  CLOSE_UP = 'Close-Up / Zoom'
}

export enum Wardrobe {
  AUTO = 'Auto',
  CORPORATE = 'Corporate',
  LINKEDIN = 'LinkedIn',
  CREATIVE = 'Creative',
  DOCTOR = 'Doctor',
  LAWYER = 'Lawyers',
  ORIGINAL = 'Original',
  ALL = 'All'
}

export enum Background {
  STUDIO = 'Studio',
  OFFICE = 'Office',
  DARK_PREMIUM = 'Dark Premium',
  OUTDOOR = 'Outdoor',
  HOSPITAL = 'Hospital',
  CREATIVE = 'Creative'
}

export enum DoctorCoatColor {
  WHITE = 'White',
  GREEN = 'Green Uniform'
}

export enum StethoscopePosition {
  NONE = 'None',
  NECK = 'Neck',
  HAND = 'Hand'
}

export enum Expression {
  PROFESSIONAL = 'Professional',
  WARM_SMILE = 'Warm Smile'
}

export enum PersonType {
  AUTO = 'Auto',
  MALE = 'Male',
  FEMALE = 'Female',
  NON_BINARY = 'Non-Binary',
  OTHER = 'Other'
}

export interface GenerationSettings {
  personType: PersonType;
  pose: PoseAngle;
  wardrobe: Wardrobe;
  background: BackgroundStyle;
  expression: Expression;
  enableSmile: boolean;
  style: AppStyle;
  clothingChoice: ClothingChoice;
  clothingStyle: ClothingStyle;
  customSuitHex?: string;
  tieColor: TieColor;
  customTieHex?: string;
  bodyPose: BodyPose;
  beautyFilter: number;
  smoothing: number;
  eyeEnhancement: boolean;
  faceLeftLighting: number;
  faceRightLighting: number;
  enableAdditionalSettings: boolean;
  enableFairness: boolean;
  enableFaceSmoothing: boolean;
  enableBeautification: boolean;
  useCustomTieColor: boolean;
  useCustomSuitColor: boolean;
  useCustomBackgroundColor: boolean;
  customBackgroundHex?: string;
  lighting: LightingOption;
  doctorCoatColor: DoctorCoatColor;
  stethoscopePosition: StethoscopePosition;
  enableBlackCoat: boolean;
  enableNeckBand: boolean;
}

export interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  grayscale: number;
  zoom: number;
}

export interface ProcessedImage {
  id: string;
  url: string;
  originalUrl: string;
  timestamp: number;
  settings: GenerationSettings;
  filters?: ImageFilters;
}

export interface UserProfile {
  id: string;
  email: string;
  tokens: number;
  previews_remaining?: number;
  full_name?: string;
  phone_no?: string;
  plan?: string;
  feedback?: string;
}

export interface TokenHistoryItem {
  id: string;
  amount: number;
  created_at: string;
  type?: string;
  timestamp?: string;
}

export interface GenerationRecord {
  id: string | number;
  image_data: string;
  thumbnail_url?: string;
  is_unlocked: boolean;
  settings: GenerationSettings;
  created_at: string;
  seed?: number;
  user_id?: string;
}

export interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}
