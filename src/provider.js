import React from 'react';
import {WhisperSyncSocket} from './socket';

export const WhisperSyncSocketContext = React.createContext(undefined);

export function SyncMachineSocketProvider(props) {
    let [apiKey, setApiKey] = React.useState(null);
    let [connection, setConnection] = React.useState(null);

    if (props.apiKey !== apiKey) {
        if (connection) {
            connection.disconnect();
        }

        setConnection(new WhisperSyncSocket({
            api_key: props.apiKey,
            url: props.url
        }));
        setApiKey(props.apiKey);
    }

    return React.createElement(
        WhisperSyncSocketContext.Provider,
        { value: connection },
        props.children
    );
}

export const useSyncMachineSocket = () => React.useContext(WhisperSyncSocketContext);
