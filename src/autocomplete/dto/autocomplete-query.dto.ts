import { Type } from "class-transformer";
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class AutocompleteQueryDto {

  @IsNotEmpty()
  @IsString()
  q: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  limit?: number;


  @IsOptional()
  @IsIn(['en', 'el', 'ru', 'uk'])
  language?: string;
}