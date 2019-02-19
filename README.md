## What is Sync Machine?

Sync Machine is a service that handles data synchronization for
your React application.

It's based on a similar programming model to Redux, where changes
to your application's state is described through events that
change the state.

## Current state

Note the version on this SDK package is `0.1.x`. This is really
an experiment and a work in progress. But it's in a good enough
state to write simple apps and experiments.

## Concepts

Sync Machine has three main concepts:

### Application
Creating an application gives you an API key that you can use to 
connect your React app to Sync Machine.

### Entity
An entity is any object in your application that you want to 
synchronize.

Are you creating a To-do list app? Then you'll probably have
`List` entities with a bunch of items.

### Update

Any time an entity changes, your application posts an
update to Sync Machine.

An update can be any JSON value.

## Getting started

There's three steps to add Sync Machine to your React 
application.

### Step 1: Add `syncmachine-sdk` to your package

If you're using `yarn`, then run:

    yarn add syncmachine-sdk

Otherwise, if you're using `npm`, then run:

    npm install --save syncmachine-sdk

Either way this will install the package and add a line to your
`package.json`'s `dependencies` section something like this:

```json
    "dependencies": {
        ... other dependencies ...
        "syncmachine-sdk": "~0.1"
    }
```

### Step 2: Create an Application to get an API key

Go to https://syncmachine.herokuapp.com and create an account,
then create an Application to generate an API key.
 
Save this API key for the next step.

### Step 3: Wrap your app in a `SyncMachineSocketProvider`

Somewhere at the top level of your React application, add this:

```jsx harmony
import {SyncMachineSocketProvider} from 'syncmachine-sdk';

// ...

return <SyncMachineSocketProvider apiKey={'API KEY GOES HERE'}>
    Your app goes here
</SyncMachineSocketProvider>;
```

This will make the SDK connect to Sync Machine and create a
connection to your Application.

It provides this connection, in the React context, to the entity
hooks we'll make in the next step.

### Step 4: Add a Sync Machine entity hook

In the component that renders your entity, use the
`useSyncMachineEntity` hook to connect to a Sync Machine entity.

I'm going to assume here that we're going to make a To-do list
application, with a `List` entity. Go ahead and substitute
whatever entity type works for your app.

First, create an entity definition that looks like this:

```jsx harmony
const listEntity = {
    kind: 'List',
    initialState: () => (
        { name: "Unnamed list", items: [] }
    ),
    applyUpdate: (entity, update) => {
        console.log("Applying update: ", update);
        // TODO: apply the update and return a new list
        return entity;
    }
};
```

There's three parts to an entity definition:

* **`kind`**: This names the kind of entity.
* **`initialState`**: This gives the structure of the entity
  before any updates have been applied to it.
* **`applyUpdate`**: This function should apply the `update` to
  the `entity` and return the new state of the entity. There's a
  whole step below about writing this function.
    
Next, use the hook to get the state of the entity. For now we'll just render the state as JSON:

```jsx harmony
const List = ({id}) => {
    const [list, entity] = useSyncMachineEntity({
        ...listEntity, id,
    });
    
    return <div>{JSON.stringify(list)}</div>;
}
```

### Step 4: Post updates to the entity

Whenever the user makes a change to the entity, post an update to
the entity. This update can be any normal Javascript object,
anything that can be turned into JSON.

For example, if you want add an item to the `List` you might
post an update like this:

```jsx harmony
    const update = {
      type: 'insert-item',
      data: {
        id: uuid(), // from the 'uuid' package (optional)
        title: 'New item title',
        completed: false
      }
    };

    // this is the same `entity` from the last snippet
    entity.postUpdate(update);
```

This update will get added to the entity's update stream and
broadcast to all clients. They'll apply it with their `applyState`
function and render the new state.


### Step 5: Write the `applyUpdate` function

Finally, actually write the `applyUpdate` function.

If you're familiar with Redux, this function is like a 'reducer'.
Like with Redux, this function should be _pure_. It should not
modify `entity`; instead, it should return a new object with the
changes.

Javascript's _spread notation_ is super handy for this.

For example, to handle updates like the one in the last snippet, we might
write an `applyUpdate` function like this:

```jsx harmony
    applyUpdate: (entity, update) => {
        switch(update.type) {
            case 'insert-item':
                return {
                    ...entity,
                    items: [
                        ...entity.items,
                        update.data
                    ]
                };
            default:
                return entity;
        }
    }
```
