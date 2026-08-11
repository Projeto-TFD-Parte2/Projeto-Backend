import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiPropertyOptional({
    description: "Email ou CPF do usuario. Campo recomendado para login.",
    example: "operador@local.com",
  })
  @IsOptional()
  @IsString()
  login?: string;

  @ApiPropertyOptional({
    description: "Email do usuario. Mantido por compatibilidade.",
    example: "operador@local.com",
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: "CPF do motorista vinculado ao usuario operador.",
    example: "12345678901",
  })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiProperty({ example: "operador123" })
  @IsString()
  @MinLength(6)
  password: string;
}
