import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../auth/roles.decorator";
import { PaginationDto } from "../../common/pagination.dto";
import {
  CreateMotoristaDto,
  UpdateMotoristaDto,
  VincularMotoristaUsuarioDto,
} from "./dto";
import { MotoristasService } from "./motoristas.service";

@ApiBearerAuth()
@ApiTags("Motoristas")
@Controller("motoristas")
export class MotoristasController {
  constructor(private readonly service: MotoristasService) {}
  @Roles("ADMIN")
  @Post()
  create(@Body() dto: CreateMotoristaDto) {
    return this.service.create(dto);
  }
  @Get() findAll(@Query() query: PaginationDto) {
    return this.service.findAll(query);
  }
  @Get("alertas/habilitacoes-vencendo") habilitacoesVencendo(
    @Query("dias") dias?: string,
  ) {
    return this.service.habilitacoesVencendo(dias ? Number(dias) : 30);
  }
  @Get(":id") findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
  @Roles("ADMIN")
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateMotoristaDto,
  ) {
    return this.service.update(id, dto);
  }
  @Roles("ADMIN")
  @Patch(":id/usuario")
  vincularUsuario(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: VincularMotoristaUsuarioDto,
  ) {
    return this.service.vincularUsuario(id, dto);
  }
  @Roles("ADMIN")
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
