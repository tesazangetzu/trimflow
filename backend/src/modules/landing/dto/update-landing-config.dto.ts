import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsHexColor,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class LandingPaletteDto {
  @IsOptional()
  @IsHexColor()
  asphalt?: string;

  @IsOptional()
  @IsHexColor()
  concrete?: string;

  @IsOptional()
  @IsHexColor()
  smoke?: string;

  @IsOptional()
  @IsHexColor()
  bone?: string;

  @IsOptional()
  @IsHexColor()
  neon?: string;

  @IsOptional()
  @IsHexColor()
  blood?: string;
}

class LandingTypographyDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  display?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  body?: string;
}

class LandingBrandingDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  heroImageUrl?: string | null;
}

class LandingPresentationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  heroTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  heroSubtitle?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tickerItems?: string[];
}

class LandingSectionsDto {
  @IsOptional()
  @IsBoolean()
  services?: boolean;

  @IsOptional()
  @IsBoolean()
  barbers?: boolean;

  @IsOptional()
  @IsBoolean()
  schedule?: boolean;

  @IsOptional()
  @IsBoolean()
  location?: boolean;

  @IsOptional()
  @IsBoolean()
  booking?: boolean;
}

export class UpdateLandingConfigDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LandingPaletteDto)
  palette?: LandingPaletteDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LandingTypographyDto)
  typography?: LandingTypographyDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LandingBrandingDto)
  branding?: LandingBrandingDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LandingPresentationDto)
  presentation?: LandingPresentationDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LandingSectionsDto)
  sections?: LandingSectionsDto;
}