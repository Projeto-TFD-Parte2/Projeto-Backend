import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsOptional, IsString } from "class-validator";

export class CreatePessoaDto {
  @IsString() nome: string;
  @IsOptional() @IsString() cpf?: string;
  @IsOptional() @IsString() cartaoSus?: string;
  @IsOptional() @IsDateString() dataNascimento?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsString() endereco?: string;
  @IsOptional() @IsString() municipio?: string;
}
export class UpdatePessoaDto extends PartialType(CreatePessoaDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
