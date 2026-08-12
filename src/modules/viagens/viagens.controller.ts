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
import { ApiTags } from "@nestjs/swagger";
import { AuthenticatedUser } from "../../auth/auth.types";
import { CurrentUser } from "../../auth/current-user.decorator";
import { Roles } from "../../auth/roles.decorator";
import { CreateViagemDto, FindViagensDto, UpdateViagemDto } from "./dto";
import { ViagensService } from "./viagens.service";
@ApiTags("Viagens")
@Controller("viagens")
export class ViagensController {
  constructor(private readonly service: ViagensService) {}
  @Roles("OPERADOR")
  @Post()
  create(@Body() dto: CreateViagemDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.id);
  }
  @Get() findAll(@Query() query: FindViagensDto) {
    return this.service.findAll(query);
  }
  @Get("motorista/:motoristaId") porMotorista(
    @Param("motoristaId", ParseIntPipe) motoristaId: number,
  ) {
    return this.service.porMotorista(motoristaId);
  }
  @Get("veiculo/:veiculoId") porVeiculo(
    @Param("veiculoId", ParseIntPipe) veiculoId: number,
  ) {
    return this.service.porVeiculo(veiculoId);
  }
  @Get(":id") findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
  @Patch(":id") update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateViagemDto,
  ) {
    return this.service.update(id, dto);
  }
  @Delete(":id") remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
