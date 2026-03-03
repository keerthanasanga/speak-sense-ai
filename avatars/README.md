# C# Avatar Definitions

This directory contains simple C# class files representing virtual interview characters.
They are intended for integration with a C#-based engine such as Unity, where the
`Character` class can be used to drive model loading, emotion states, and blendshapes.

## Example usage

```csharp
using SpeakSenseAI.Avatars;

var interviewer = new Character("Alex", "Assets/Models/Interviewer.glb");
interviewer.UpdateEmotion(Emotion.Thinking);
interviewer.ConfidenceScore = 0.85f;

Debug.Log(interviewer);
```

You can extend this namespace with behavior controllers, state machines, or
network synchronization as required by your application.

## Unity Integration

A sample MonoBehaviour (`AvatarController.cs`) is provided to show how the
`Character` class might be used in a Unity project. The companion
`SpeakSenseAI.csproj` file allows the directory to be added as a .NET
library if you're building outside of Unity.

The controller demonstrates:

```csharp
public class AvatarController : MonoBehaviour
{
    public string characterName = "Interviewer";
    public string modelResourcePath = "Models/Interviewer"; // Resources folder path

    private Character character;
    // ...
}
```

Build the project with `dotnet build` or include the files directly in your
Unity `Assets` folder. The controller handles basic breathing animation and
blendshape synchronization and exposes methods to update emotion/confidence.

### WebSocket Interop Example

If you need to synchronize state between the React frontend and a Unity scene, a simple
WebSocket connection can be used. Below are minimal snippets illustrating
how JavaScript and C# might talk to each other:

**JavaScript (React side)**
```js
const socket = new WebSocket("ws://localhost:4500");
socket.onopen = () => console.log("connected to Unity");
socket.onmessage = (evt) => {
  const data = JSON.parse(evt.data);
  if (data.type === "emotion") {
    // update local avatar or HUD
    setEmotion(data.value);
  }
};

function sendConfidence(score) {
  socket.send(JSON.stringify({ type: "confidence", value: score }));
}
```

**C# (Unity side)**
```csharp
using System;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using UnityEngine;

public class WebSocketClient : MonoBehaviour
{
    private ClientWebSocket ws;

    async void Start()
    {
        ws = new ClientWebSocket();
        await ws.ConnectAsync(new Uri("ws://localhost:4500"), CancellationToken.None);
        Debug.Log("Connected to React app");
        ReceiveLoop();
    }

    async void ReceiveLoop()
    {
        var buffer = new byte[1024];
        while (ws.State == WebSocketState.Open)
        {
            var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
            var message = Encoding.UTF8.GetString(buffer, 0, result.Count);
            Debug.Log($"Received: {message}");
            // parse JSON and update avatar state
        }
    }

    public async void SendMessage(object obj)
    {
        var msg = Encoding.UTF8.GetBytes(JsonUtility.ToJson(obj));
        await ws.SendAsync(new ArraySegment<byte>(msg), WebSocketMessageType.Text, true, CancellationToken.None);
    }
}
```

This approach lets the browser push metrics (confidence, speech) to Unity, and Unity
can send back animation commands or emotion updates.
