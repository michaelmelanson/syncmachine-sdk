import { useEffect, useState } from 'react';

import { useSyncMachineSocket } from './provider';


export function useSyncMachineEntity({kind, id, initialState, applyUpdate}) {
    const socket = useSyncMachineSocket();

    const [entityState, setEntityState] = useState(initialState());

    // TODO store this in local storage
    const [lastVersion, setLastVersion] = useState(0);

    useEffect(() => {
        const subscription = socket.subscribeUpdates(kind, id, {
            received: (updates) => {
                console.log("Received:", updates);

                if (!(updates && updates.length > 0)) {
                    console.warn("Received empty update");
                    return;
                }

                for (let {data, version} of updates) {
                    const update = JSON.parse(data);
                    setEntityState(entityState => {
                        const newState = applyUpdate(entityState, update);
                        console.log("Applied update, new state is", newState);
                        return newState;
                    });
                    setLastVersion(version);
                }

                socket.postStreamPosition(kind, id, updates[updates.length - 1].version);
            },

            connected: () => {
                console.log("Requesting entity updates");
                socket.postStreamPosition(kind, id, lastVersion);
            }
        });

        return () => {
            socket.unsubscribeUpdates(subscription);
        };
    }, [socket]);

    const postUpdate = (update) => socket.postUpdate(kind, id, update);

    return [entityState, {
        postUpdate
    }];
}