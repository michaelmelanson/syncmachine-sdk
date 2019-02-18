import * as ActionCable from "actioncable";

ActionCable.startDebugging();

const ACCESS_TOKEN_KEY = "syncmachine-access-token";

export class WhisperSyncSocket {
    constructor(config) {

        const api_key = config.api_key;
        const url = config.url || "wss://syncmachine.herokuapp.com/ws/";

        if (!api_key) {
            throw Error("You need to provide an API key as 'api_key' in the config");
        }

        if (!url) {
            throw Error("You need to provide a URL to connect to, or nothing to use the production server.");
        }

        this.subscriptions = [];

        let access_token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
        if (access_token) {
            console.log("Connecting to", url, "using access token:", access_token);
            this.consumer = ActionCable.createConsumer(`${url}?access_token=${access_token}`);
        } else {
            console.log("Connecting to", url, "using API key:", api_key);
            this.consumer = ActionCable.createConsumer(`${url}?api_key=${api_key}`);
        }

        const self = this;

        this.commandChannel = this.consumer.subscriptions.create('CommandChannel', {
            received: (payload) => {
                console.log("Received command: ", payload);

                const {kind, id, access_token, updates} = payload;

                if (access_token) {
                    window.localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
                } else if (updates) {

                    self.subscriptions.forEach(s => {
                        if (s.kind === kind && s.id === id) {
                            s.received(updates);
                        }
                    })
                }
            },

            connected: () => {
                if (!access_token) {
                    this.commandChannel.perform('access_token');
                }
            }
        });

        this.consumer.connect();
    }

    subscribeUpdates(kind, id, {received, connected}) {
        this.subscriptions.push({kind, id, received});
        return this.consumer.subscriptions.create({kind, id, channel: 'UpdatesChannel'}, {
            received,
            connected
        });
    }

    unsubscribeUpdates(subscription) {
        this.consumer.subscriptions.delete(subscription);
    }

    postStreamPosition(kind, id, lastVersion) {
        console.log("Setting stream position for", kind, id, "to", lastVersion);
        this.commandChannel.perform('post_stream_position', {kind, id, lastVersion});
    }

    postUpdate(kind, id, update) {
        console.log("Posting update to", kind, id, ":", update);
        this.commandChannel.perform('post_update', {kind, id, update});
    }
}