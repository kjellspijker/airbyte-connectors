import { AirbyteConfig, AirbyteLogger, AirbyteStreamBase, StreamKey, SyncMode } from 'faros-airbyte-cdk';
import { Dictionary } from 'ts-essentials';
import axios from "axios";

export class Projects extends AirbyteStreamBase {
    constructor(readonly config: AirbyteConfig, logger: AirbyteLogger) {
        super(logger);
    }

    getJsonSchema(): Dictionary<any, string> {
        return require('../../resources/schemas/projects.json');
    }

    get primaryKey(): StreamKey {
        return 'id';
    }

    // get cursorField(): string | string[] {
    //     return 'updated_at';
    // }

    async* readRecords(
        syncMode: SyncMode,
        cursorField?: string[],
        streamSlice?: Dictionary<any, string>,
        streamState?: Dictionary<any, string>
    ): AsyncGenerator<Dictionary<any, string>, any, unknown> {
        const response = await axios.get(this.config.server_url + '/api/v2/projects/project', {
            headers : {
                'Authentication-Key'    : this.config.authentication_key,
                'Authentication-Secret' : this.config.authentication_secret,
                'Content-Type'          : 'application/json',
                'Accept'                : 'application/json'
            },
            params  : {
                'limit' : 100
            }
        });

        for (const project of response.data.data) {
            yield project;
        }
    }

    // getUpdatedState(
    //     currentStreamState: Dictionary<any>,
    //     latestRecord: Dictionary<any>
    // ): Dictionary<any> {
    //     return {
    //         cutoff : Math.max(
    //             currentStreamState.cutoff ?? 0,
    //             latestRecord.updated_at ?? 0
    //         ),
    //     };
    // }
}
