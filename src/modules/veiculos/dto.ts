import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { TipoVeiculo } from "@prisma/client";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";

export class CreateVeiculoDto {
  @IsString() nome: string;
  @IsString() @Length(7, 10) placa: string;
  @IsInt() @Min(1900) @Max(2100) ano: number;
  @IsString() renavam: string;
  @ApiProperty({ enum: TipoVeiculo }) @IsEnum(TipoVeiculo) tipo: TipoVeiculo;
}
export class UpdateVeiculoDto extends PartialType(CreateVeiculoDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
