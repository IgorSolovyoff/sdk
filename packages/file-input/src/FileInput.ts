import * as React from 'react';
import { withApollo } from 'react-apollo';
import { ApolloClient } from 'apollo-client';
import * as filestack from 'filestack-js';
import gql from 'graphql-tag';

type FileValue = {
  fileId: string,
  filename: string,
  id?: string,
  downloadUrl?: string,
};

type FileInputValue = FileValue | FileValue[];
type OriginalFileInputValue = File | File[];

type FileInputProps = {
  onChange?: (value: FileInputValue, originalFile: OriginalFileInputValue) => void,
  children: (args: { 
    pick: (options: {}) => Promise<void>, 
    value: FileInputValue | null, 
    originalFile: OriginalFileInputValue | null, 
    error: Object | null,
  }) => React.ReactNode,
  public?: boolean,
  maxFiles?: number,
  onUploadDone?: (value: FileInputValue, originalFile?: OriginalFileInputValue) => Promise<FileInputValue>,
  value?: FileInputValue | null,
};

type FileInputState = {
  path: string | null,
  error: Object | null,
  value: FileInputValue | null,
  originalFile: OriginalFileInputValue | null,
};

const FILE_UPLOAD_INFO_QUERY = gql`
  query FileUploadInfo {
    fileUploadInfo {
      policy
      signature
      apiKey
      path
    }
  }
`;

const FileInput: React.ComponentType<FileInputProps> = withApollo(
  class FileInput extends React.Component<FileInputProps & { client: ApolloClient<any> }, FileInputState> {
    // @ts-ignore
    filestack: { [key: string]: any };
    // @ts-ignore
    filestackPromise: Promise<void>;

    static defaultProps = {
      maxFiles: 1,
      value: null,
    };

    constructor(props: FileInputProps & { client: ApolloClient<any> }) {
      super(props);

      this.state = {
        path: null,
        error: null,
        originalFile: null,
        value: props.value || null,
      };
    }

    componentDidMount() {
      this.filestackPromise = this.initFilestack();
    }

    static getDerivedStateFromProps(props: FileInputProps, state: FileInputState) {
      let nextState = null;

      if (props.value !== state.value) {
        nextState = { value: props.value };
      }

      return nextState;
    }

    async initFilestack() {
      const { client } = this.props;

      let response = null;

      try {
        response = await client.query({ query: FILE_UPLOAD_INFO_QUERY });
      } catch (e) {
        this.setState({ error: e });

        return;
      }

      const { apiKey, policy, signature, path } = response.data.fileUploadInfo;

      this.setState({ path });

      this.filestack = filestack.init(apiKey, {
        security: {
          policy,
          signature,
        },
      });
    }

    onUploadDone = async ({ filesUploaded }: any) => {
      const { policy = '""', signature = '""' } = this.filestack.session;

      let value = filesUploaded.map(({ handle, filename, url }: any) => {
        const urlOrigin = url ? new URL(url).origin : '';

        return {
          fileId: handle,
          filename,
          downloadUrl: `${urlOrigin}/security=p:${policy},s:${signature}/${handle}`,
          public: !!this.props.public,
        };
      });

      let originalFile = filesUploaded.map((item: any) => item.originalFile);

      const { maxFiles, onUploadDone, onChange } = this.props;

      if (maxFiles === 1) {
        value = value[0];
        originalFile = originalFile[0];
      }

      if (typeof onUploadDone === 'function') {
        value = await onUploadDone(value, originalFile);
      }

      this.setState({ value, originalFile });

      if (typeof onChange === 'function') {
        onChange(value, originalFile);
      }
    };

    collectPickerOptions = () => {
      const { maxFiles } = this.props;
      const { path } = this.state;

      return {
        exposeOriginalFile: true,
        onUploadDone: this.onUploadDone,
        storeTo: {
          path,
        },
        maxFiles,
      };
    };

    pick = async (options = {}) => {
      await this.filestackPromise;

      if ('maxFiles' in options) {
        console.warn('Specify "maxFiles" as a prop for FileInput component');
      }

      if ('onUploadDone' in options) {
        console.warn('Specify "onUploadDone" as a prop for FileInput component');
      }

      const pickerOptions = this.collectPickerOptions();

      this.filestack
        .picker({
          ...options,
          ...pickerOptions,
        })
        .open();
    };

    render() {
      const { children } = this.props;

      const { error, value, originalFile } = this.state;

      return children({ pick: this.pick, value, originalFile, error });
    }
  }
)


export { FileInput };