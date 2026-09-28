import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

const ROTAS_PUBLICAS = ['/auth/login', '/auth/refresh'];

// Agrupa as rotas pelo primeiro segmento (o nome do modulo) e exige o token
// JWT em todas, exceto nas rotas publicas de autenticacao.
function organizarDocumento(documento: OpenAPIObject): OpenAPIObject {
  for (const [caminho, operacoes] of Object.entries(documento.paths)) {
    const modulo = caminho.split('/')[1] || 'app';

    for (const operacao of Object.values(operacoes)) {
      if (
        !operacao ||
        typeof operacao !== 'object' ||
        !('responses' in operacao)
      ) {
        continue;
      }
      operacao.tags = [modulo];
      operacao.security = ROTAS_PUBLICAS.includes(caminho)
        ? []
        : [{ bearer: [] }];
    }
  }
  return documento;
}

export function configurarSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('OpticaFlow API')
    .setDescription('API do sistema de gestao de oticas OpticaFlow')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .build();

  const documento = organizarDocumento(
    SwaggerModule.createDocument(app, config),
  );

  SwaggerModule.setup('docs', app, documento, {
    swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha' },
  });
}
