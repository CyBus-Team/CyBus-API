import { Type } from "class-transformer"
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min, IsNumber } from "class-validator"

export class AutocompleteQueryDto {

  constructor(partial?: Partial<AutocompleteQueryDto>) {
    Object.assign(this, partial)
  }

  // The search query text (e.g., "Lidl")
  @IsNotEmpty()
  @IsString()
  q: string

  // Optional: maximum number of results to return (must be >= 1)
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  limit?: number


  // Optional: language for the result (supports 'en', 'el', 'ru', 'uk')
  @IsOptional()
  @IsIn(['en', 'el', 'ru', 'uk'])
  language?: string

  // Optional: user's latitude to prioritize closer results
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number

  // Optional: user's longitude to prioritize closer results
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number

}