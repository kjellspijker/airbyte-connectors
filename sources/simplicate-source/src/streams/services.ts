import { AirbyteConfig, AirbyteLogger, AirbyteStreamBase, StreamKey, SyncMode } from 'faros-airbyte-cdk';
import { Dictionary } from 'ts-essentials';
import axios from "axios";

export class Services extends AirbyteStreamBase {
    constructor(readonly config: AirbyteConfig, logger: AirbyteLogger) {
        super(logger);
    }

    getJsonSchema(): Dictionary<any, string> {
        return require('../../resources/schemas/services.json');
    }

    get primaryKey(): StreamKey {
        return 'id';
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
        };

        let loadedAllData = false;

        do {
            const response = await axios.get(this.config.server_url + '/api/v2/services/defaultservice', {
                headers: {
                    'Authentication-Key': this.config.authentication_key,
                    'Authentication-Secret': this.config.authentication_secret,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                params,
            });

            for (const service of response.data.data) {
                yield service;
            }

            loadedAllData = response.data.data.length < params.limit;

            params['offset'] += params.limit;

            // sleep 1 second to avoid hitting rate limits
            await new Promise(resolve => setTimeout(resolve, this.config.sleep_time));
        } while (!loadedAllData);
    }
}
