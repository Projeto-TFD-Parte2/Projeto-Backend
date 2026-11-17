import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../auth/roles.decorator";
import {
  CreateUsuarioDto,
  UpdateUsuarioDto,
  UpdateUsuarioSenhaDto,
} from "./dto";
import { UsuariosService } from "./usuarios.service";

@ApiBearerAuth()
@ApiTags("Usuarios")
@Roles("ADMIN")
@Controller("usuarios")
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Post()
  create(@Body() dto: CreateUsuarioDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateUsuarioDto) {
    return this.service.update(id, dto);
  }

  @Patch(":id/senha")
  updateSenha(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioSenhaDto,
  ) {
    return this.service.updateSenha(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
