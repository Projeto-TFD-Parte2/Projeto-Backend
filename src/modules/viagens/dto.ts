import { ApiProperty, PartialType } from "@nestjs/swagger";
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

export class ParticipanteViagemDto {
  @IsInt() pessoaId: number;
  @ApiProperty({ enum: TipoParticipacao })
  @IsEnum(TipoParticipacao)
  tipoParticipacao: TipoParticipacao;
  @IsOptional() @IsString() observacao?: string;
}

export class CreateViagemDto {
  @IsInt() veiculoId: number;
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
