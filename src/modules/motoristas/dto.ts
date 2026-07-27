import { ApiProperty, PartialType } from "@nestjs/swagger";
import { TipoVinculoMotorista } from "@prisma/client";
import { IsDateString, IsEnum, IsInt, IsString } from "class-validator";

export class DadosMotoristaDto {
  @IsString() cpf: string;
  @IsString() endereco: string;
  @IsString() renach: string;
  @IsDateString() validadeHabilitacao: string;
  @IsString() tipoHabilitacao: string;
  @ApiProperty({ enum: TipoVinculoMotorista })
  @IsEnum(TipoVinculoMotorista)
  tipoVinculo: TipoVinculoMotorista;
}

export class CreateMotoristaDto extends DadosMotoristaDto {
  @IsInt() usuarioId: number;
}

export class UpdateMotoristaDto extends PartialType(DadosMotoristaDto) {}

export class VincularMotoristaUsuarioDto {
  @IsInt() usuarioId: number;
}
