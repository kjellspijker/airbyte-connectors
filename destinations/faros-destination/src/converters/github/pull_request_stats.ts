import {AirbyteRecord} from 'faros-airbyte-cdk';

import {Converter, DestinationModel, DestinationRecord} from '../converter';
import {GithubCommon} from './common';

export class GithubPullRequestStats extends Converter {
  readonly destinationModels: ReadonlyArray<DestinationModel> = [
    'vcs_PullRequest',
  ];

  convert(record: AirbyteRecord): ReadonlyArray<DestinationRecord> {
    const source = this.streamName.source;
    const prStats = record.record.data;
    const repository = GithubCommon.parseRepositoryKey(
      prStats.repository,
      source
    );

    if (!repository) return [];

    return [
      {
        model: 'vcs_PullRequest__Update',
        record: {
          at: record.record.emitted_at,
          where: {
            number: prStats.number,
            repository,
          },
          mask: ['commitCount', 'commentCount', 'diffStats'],
          patch: {
            commitCount: prStats.commits,
            commentCount: prStats.comments + prStats.review_comments,
            diffStats: {
              linesAdded: prStats.additions,
              linesDeleted: prStats.deletions,
              filesChanged: prStats.changed_files,
            },
          },
        },
      },
    ];
  }
}
