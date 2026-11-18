import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

const PASSWORD_MESSAGE = 'La contraseña es obligatoria';

export class LoginDto {
  @ApiProperty({ example: 'admin@croper.test' })
  @IsEmail({}, { message: 'El correo no es válido' })
  email: string;

  @ApiProperty({ example: 'Admin1234!' })
  @IsString({ message: PASSWORD_MESSAGE })
  @IsNotEmpty({ message: PASSWORD_MESSAGE })
  password: string;
}
