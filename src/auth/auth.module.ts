import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsuarioModule } from 'src/usuario/usuario.module';
import { JwtModule } from '@nestjs/jwt';
import { AcessoModule } from 'src/acesso/acesso.module';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [
    forwardRef(() => UsuarioModule), // Use forwardRef to resolve circular dependency
    PassportModule,
    AcessoModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  exports: [AuthService],
})
export class AuthModule {}
