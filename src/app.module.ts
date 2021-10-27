import { AppGateway } from './app.gateway';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HelloController } from './hello/hello.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), HttpModule],
  controllers: [HelloController],
  providers: [AppGateway],
})
export class AppModule {}
