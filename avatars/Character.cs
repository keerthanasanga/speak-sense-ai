// Simple C# representation of a virtual interview character
// This file can be used by a Unity project or other C#-based engine
// to describe avatar properties and behavior.

using System;
using System.Collections.Generic;

namespace SpeakSenseAI.Avatars
{
    public enum Emotion
    {
        Neutral,
        Happy,
        Sad,
        Thinking,
        Surprised,
        Angry
    }

    public class Character
    {
        public string Name { get; set; }
        public string ModelPath { get; set; }      // path to a 3D model (GLB/FBX)
        public Emotion CurrentEmotion { get; set; }
        public float ConfidenceScore { get; set; } // engagement/confidence metric
        public Dictionary<string, float> BlendShapeValues { get; private set; }

        public Character(string name, string modelPath)
        {
            Name = name;
            ModelPath = modelPath;
            CurrentEmotion = Emotion.Neutral;
            ConfidenceScore = 0f;
            BlendShapeValues = new Dictionary<string, float>();
        }

        public void UpdateEmotion(Emotion emotion)
        {
            CurrentEmotion = emotion;
            // hook into animation controller or AI logic
        }

        public void SetBlendShape(string key, float value)
        {
            if (BlendShapeValues.ContainsKey(key))
                BlendShapeValues[key] = value;
            else
                BlendShapeValues.Add(key, value);
        }

        public override string ToString()
        {
            return $"Character(Name={Name}, Emotion={CurrentEmotion}, Confidence={ConfidenceScore})";
        }
    }
}
