import { AirbyteConfig, AirbyteLogger, AirbyteStreamBase, StreamKey, SyncMode } from 'faros-airbyte-cdk';
import { Dictionary } from 'ts-essentials';
import axios from "axios";

export class Hours extends AirbyteStreamBase {
    private date: Date;

    constructor(readonly config: AirbyteConfig, logger: AirbyteLogger) {
        super(logger);
        this.date = new Date();
    }

    getJsonSchema(): Dictionary<any, string> {
        return require('../../resources/schemas/hours.json');
    }

    get primaryKey(): StreamKey {
        return 'id';
    }

    get cursorField(): string | string[] {
        return 'updated_at';
    }

    async* readRecords(
        syncMode: SyncMode,
        cursorField?: string[],
        streamSlice?: Dictionary<any, string>,
        streamState?: Dictionary<any, string>
    ): AsyncGenerator<Dictionary<any, string>, any, unknown> {
        const params = {
            'limit': 100,
            'offset': 0,
            'sort': 'updated_at',
        };

        if (Object.prototype.hasOwnProperty.call(streamState, 'cutoff')) {
            params['q[updated_at][ge]'] = streamState.cutoff;
        }

        yield* await this.loadAllData(params);

        if (Object.prototype.hasOwnProperty.call(params, 'q[updated_at][ge]')) {
            delete params['q[updated_at][ge]'];
            params.sort = 'created_at';
            params.offset = 0;
            params['q[created_at][ge]'] = streamState.cutoff;

            yield* await this.loadAllData(params);
        }
    }

    private async* loadAllData(params: { offset: number; limit: number; sort: string }) {
        let loadedAllData = false;

        do {
            const response = await this.makeRequest(params);

            for (const hour of response.data.data) {
                yield hour;
            }

            loadedAllData = response.data.data.length < params.limit;

            params['offset'] += params.limit;

            // sleep to avoid hitting rate limits
            await new Promise(resolve => setTimeout(resolve, this.config.sleep_time));
        } while (!loadedAllData);
    }

    private async makeRequest(params: { offset: number; limit: number; sort: string }) {
        return await axios.get(this.config.server_url + '/api/v2/hours/hours', {
            headers: {
                'Authentication-Key': this.config.authentication_key,
                'Authentication-Secret': this.config.authentication_secret,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            params,
        });
    }

    getUpdatedState(
        currentStreamState: Dictionary<any>,
        latestRecord: Dictionary<any>
    ): Dictionary<any> {
        return {
            cutoff: (new Intl.DateTimeFormat('sv-se', { dateStyle: 'short', timeStyle: 'medium' })).format(this.date),
        };
    }
}
