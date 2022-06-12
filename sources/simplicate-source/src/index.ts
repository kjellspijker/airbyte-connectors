import { Command } from 'commander';
import {
    AirbyteConfig,
    AirbyteLogger,
    AirbyteSourceBase,
    AirbyteSourceRunner,
    AirbyteSpec,
    AirbyteStreamBase,
} from 'faros-airbyte-cdk';
import VError from 'verror';

import { Projects, Employees, HoursTypes, Services, Hours } from './streams';

/** The main entry point. */
export function mainCommand(): Command {
    const logger = new AirbyteLogger();
    const source = new SimplicateSource(logger);
    return new AirbyteSourceRunner(logger, source).mainCommand();
}

/** Example source implementation. */
class SimplicateSource extends AirbyteSourceBase {
    async spec(): Promise<AirbyteSpec> {
        return new AirbyteSpec(require('../resources/spec.json'));
    }

    async checkConnection(config: AirbyteConfig): Promise<[boolean, VError]> {
        if (config.server_url == null) {
            return [false, new VError('server_url has not been set')]
        }
        // validate if server_url starts with https:// and ends with simplicate.nl
        if (!config.server_url.startsWith('https://') || !config.server_url.endsWith('simplicate.nl')) {
            return [false, new VError('invalid server_url')];
        }
        if (config.authentication_key == null) {
            return [false, new VError('authentication_key has not been set')];
        }
        if (config.authentication_secret == null) {
            return [false, new VError('authentication_secret has not been set')];
        }
        if (config.sleep_time == null) {
            return [false, new VError('sleep_time has not been set')];
        }

        return [true, null];
    }

    streams(config: AirbyteConfig): AirbyteStreamBase[] {
        return [
            new Projects(config, this.logger),
            new Employees(config, this.logger),
            new HoursTypes(config, this.logger),
            new Services(config, this.logger),
            new Hours(config, this.logger),
        ];
    }
}
