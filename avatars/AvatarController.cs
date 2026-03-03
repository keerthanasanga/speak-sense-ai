// Unity MonoBehaviour for controlling avatar behaviour using the Character class
// Attach this script to a GameObject in a Unity scene and assign a Character
// instance to drive its visual state (emotions, confidence, blendshapes).

using UnityEngine;
using SpeakSenseAI.Avatars;

public class AvatarController : MonoBehaviour
{
    public string characterName = "Interviewer";
    public string modelResourcePath = "Models/Interviewer"; // Resources folder path

    private Character character;
    private SkinnedMeshRenderer skinnedRenderer;

    void Awake()
    {
        character = new Character(characterName, modelResourcePath);
        // assume the model is a child of this GameObject with a SkinnedMeshRenderer
        skinnedRenderer = GetComponentInChildren<SkinnedMeshRenderer>();
    }

    void Start()
    {
        // initial emotion or behaviour setup
        character.UpdateEmotion(Emotion.Neutral);
    }

    void Update()
    {
        // simple breathing animation example
        float scale = 1.0f + Mathf.Sin(Time.time * 2.0f) * 0.01f;
        transform.localScale = new Vector3(scale, scale, scale);

        // synchronize blendshapes if renderer available
        if (skinnedRenderer != null)
        {
            foreach (var kv in character.BlendShapeValues)
            {
                int index = skinnedRenderer.sharedMesh.GetBlendShapeIndex(kv.Key);
                if (index >= 0)
                {
                    skinnedRenderer.SetBlendShapeWeight(index, kv.Value * 100f);
                }
            }
        }
    }

    public void SetEmotion(Emotion emotion)
    {
        character.UpdateEmotion(emotion);
        // here you could trigger animation clips or morph targets
    }

    public void SetConfidence(float score)
    {
        character.ConfidenceScore = Mathf.Clamp01(score);
    }
}
