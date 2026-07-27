import { OmitType, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";
import { DadosMotoristaDto } from "../motoristas/dto";

export enum UsuarioRoleDto {
  ADMIN = "ADMIN",
  OPERADOR = "OPERADOR",
}

export class CreateUsuarioDto {
  @IsString()
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsEnum(UsuarioRoleDto)
  role?: UsuarioRoleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DadosMotoristaDto)
  motorista?: DadosMotoristaDto;
}

export class UpdateUsuarioDto extends PartialType(
  OmitType(CreateUsuarioDto, ["motorista", "role"] as const),
) {
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateUsuarioSenhaDto {
  @IsString()
  @MinLength(8)
  password: string;
}
