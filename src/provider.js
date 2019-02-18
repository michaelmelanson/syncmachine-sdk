import React, { useContext, useState } from 'react';
import {WhisperSyncSocket} from './socket';

export const WhisperSyncSocketContext = React.createContext();

export function SyncMachineSocketProvider(props) {
    let [apiKey, setApiKey] = useState(null);
    let [connection, setConnection] = useState(null);

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

    return <WhisperSyncSocketContext.Provider value={connection}>
        { props.children }
    </WhisperSyncSocketContext.Provider>;
}

export const useSyncMachineSocket = () => useContext(WhisperSyncSocketContext);
