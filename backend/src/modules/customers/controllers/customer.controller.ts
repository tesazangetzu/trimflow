import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerService } from '../services/customer.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Post()
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Crear cliente' })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Get()
  @Roles('super-admin', 'admin', 'barber')
  @ApiOperation({ summary: 'Listar clientes' })
  findAll(@Query('branchId') branchId?: string) {
    return this.customerService.findAll(branchId);
  }

  @Get(':id')
  @Roles('super-admin', 'admin', 'barber')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  @Patch(':id')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Actualizar cliente' })
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @Roles('super-admin', 'admin')
  @ApiOperation({ summary: 'Eliminar cliente' })
  remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }
}
