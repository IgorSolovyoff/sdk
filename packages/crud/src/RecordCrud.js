// @flow
import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import type { TableSchema } from '@8base/utils';

import type { QueryResult } from './types';
import {
  createTableRowCreateTag,
  createTableRowUpdateTag,
  createTableRowDeleteTag,
} from './queryTableGenerator';

type CrudModes = 'create' | 'update' | 'delete'

type RecordCrudProps = {
  tableMeta: TableSchema,
  mode: CrudModes,

  children: (
    mutateFunction: (Object) => Promise<Object>,
    mutateResult: QueryResult
  ) => React$Node,
}

const createRecordTag = (tableMeta: *, mode: CrudModes) => {
  switch (mode) {
    case 'create': return createTableRowCreateTag(tableMeta);
    case 'update': return createTableRowUpdateTag(tableMeta);
    case 'delete': return createTableRowDeleteTag(tableMeta);
    default: return null;
  }
};

export class RecordCrud extends Component<RecordCrudProps> {
  render() {
    const { tableMeta, children, mode, ...rest } = this.props;
    const mutation = gql(createRecordTag(tableMeta, mode));

    return (
      <Mutation
        { ...rest }
        mutation={ mutation }
      >
        { (mutateFunction, mutateResult) =>
          children(
            (data) => mutateFunction({ variables: { data }}),
            mutateResult,
          ) }
      </Mutation>
    );
  }
}