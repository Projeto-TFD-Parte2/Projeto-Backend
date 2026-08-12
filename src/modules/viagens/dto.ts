import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { TipoParticipacao } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { PaginationDto } from "../../common/pagination.dto";

export class ParticipanteViagemDto {
  @IsInt() pessoaId: number;
  @ApiProperty({ enum: TipoParticipacao })
  @IsEnum(TipoParticipacao)
  tipoParticipacao: TipoParticipacao;
  @IsOptional() @IsString() observacao?: string;
}

export class CreateViagemDto {
  @IsInt() veiculoId: number;
  @IsInt() cidadeOrigemId: number;
  @IsInt() cidadeDestinoId: number;
  @IsDateString() dataSaida: string;
  @IsOptional() @IsDateString() dataEntrada?: string;
  @IsOptional() @IsString() observacao?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ParticipanteViagemDto)
  pessoas: ParticipanteViagemDto[];
}
export class UpdateViagemDto extends PartialType(CreateViagemDto) {}

export class FindViagensDto extends PaginationDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  motoristaId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cidadeDestinoId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: "ID da pessoa/passageiro participante da viagem.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  passageiroId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: "Alias de passageiroId, mantido para consultas por pessoa.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pessoaId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  veiculoId?: number;

  @ApiPropertyOptional({
    example: "2026-05-01",
    description: "Data inicial da saida da viagem (inclusiva).",
  })
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiPropertyOptional({
    example: "2026-05-31",
    description: "Data final da saida da viagem (inclusiva).",
  })
  @IsOptional()
  @IsDateString()
  dataFim?: string;
}
