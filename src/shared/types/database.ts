export type ProfileRole = 'customer' | 'builder' | 'administrator';
export type Profile = { id: string; role: ProfileRole; full_name: string; phone: string | null; avatar_path: string | null; district: string | null; created_at: string; updated_at: string };
export type Builder = { profile_id: string; business_name: string | null; bio: string | null; years_experience: number; verification_status: 'pending' | 'verified' | 'rejected'; average_rating: number; completed_jobs: number; response_time_minutes: number | null };
export type Category = { id: string; name: string; slug: string; icon: string | null };
export type Skill = { id: string; category_id: string | null; name: string };
export type BuilderSkill = { builder_id: string; skill_id: string };
export type PortfolioItem = { id: string; builder_id: string; storage_path: string; caption: string | null; created_at: string };
export type BuilderDocument = { id: string; builder_id: string; type: 'national_id' | 'certificate' | 'license'; storage_path: string; review_status: 'pending' | 'approved' | 'rejected'; created_at: string };
