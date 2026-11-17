import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, Length } from "class-validator";
export class CreateCidadeDto {
  @IsString() nome: string;
  @IsString() @Length(2, 2) uf: string;
}

export class UpdateCidadeDto extends PartialType(CreateCidadeDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
