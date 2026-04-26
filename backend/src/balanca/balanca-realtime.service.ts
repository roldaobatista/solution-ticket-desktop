import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { BalancaConnectionService } from './balanca-connection.service';
import { LeituraPeso } from './parsers/parser.interface';

export interface PesoEvent {
  data: {
    balancaId: string;
    peso: number;
    estavel: boolean;
    bruto: string;
    timestamp: string;
  };
}

@Injectable()
export class BalancaRealtimeService {
  constructor(private readonly conn: BalancaConnectionService) {}

  stream(id: string, tenantId: string): Observable<PesoEvent> {
    return new Observable<PesoEvent>((subscriber) => {
      let emitter: ReturnType<typeof this.conn.getEmitter>;
      const start = async () => {
        if (!this.conn.isConectada(id)) {
          try {
            await this.conn.conectar(id, tenantId);
          } catch (err) {
            subscriber.error(err);
            return;
          }
        }
        emitter = this.conn.getEmitter(id);
        if (!emitter) {
          subscriber.error(new Error('Sem emitter para balanca'));
          return;
        }
        const onLeitura = (l: LeituraPeso) => {
          subscriber.next({
            data: {
              balancaId: id,
              peso: l.peso,
              estavel: l.estavel,
              bruto: l.bruto,
              timestamp: new Date().toISOString(),
            },
          });
        };
        const onError = (e: Error) => subscriber.error(e);
        emitter.on('leitura', onLeitura);
        emitter.on('error', onError);
        subscriber.add(() => {
          emitter?.off('leitura', onLeitura);
          emitter?.off('error', onError);
        });

        // Envia a última leitura conhecida de imediato
        const ultima = this.conn.getUltimaLeitura(id);
        if (ultima) onLeitura(ultima);
      };
      void start();
    });
  }
}
