import {AirbyteRecord} from 'faros-airbyte-cdk';
import {Utils} from 'faros-feeds-sdk';

import {GitlabCommon, GitlabConverter} from '../common/gitlab';
import {DestinationModel, DestinationRecord, StreamContext} from '../converter';

export class Pipelines extends GitlabConverter {
  source = 'GitLab-CI';

  readonly destinationModels: ReadonlyArray<DestinationModel> = [
    'cicd_Build',
    'cicd_BuildCommitAssociation',
  ];

  async convert(
    record: AirbyteRecord,
    ctx: StreamContext
  ): Promise<ReadonlyArray<DestinationRecord>> {
    const source = this.streamName.source;
    const pipeline = record.record.data;
    const res: DestinationRecord[] = [];

    const repository = GitlabCommon.parseRepositoryKey(pipeline.webUrl, source);

    if (!repository) return [];

    const status = GitlabCommon.convertBuildStatus(pipeline.status);
    const endedAt =
      status.category == 'Running' || status.category == 'Queued'
        ? null
        : Utils.toDate(pipeline.updatedAt);

    const buildKey = GitlabCommon.createBuildKey(pipeline.id, repository);

    res.push({
      model: 'cicd_Build',
      record: {
        ...buildKey,
        number: pipeline.id,
        status,
        url: pipeline.webUrl,
        startedAt: Utils.toDate(pipeline.createdAt),
        endedAt,
      },
    });

    res.push({
      model: 'cicd_BuildCommitAssociation',
      record: {
        build: buildKey,
        commit: {repository, sha: pipeline.commitSha},
      },
    });

    return res;
  }
}
