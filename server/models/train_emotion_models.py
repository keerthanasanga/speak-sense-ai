import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
from dataset_loaders import RAVDESSLoader, FER2013Loader

class EmotionClassifier:
    """Base class for emotion classification models"""
    
    def __init__(self, input_shape, num_classes):
        self.input_shape = input_shape
        self.num_classes = num_classes
        self.model = None
    
    def build_cnn_model(self):
        """Build CNN model for emotion recognition"""
        model = keras.Sequential([
            layers.Conv2D(32, (3, 3), activation='relu', input_shape=self.input_shape),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.25),
            
            layers.Conv2D(64, (3, 3), activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.25),
            
            layers.Conv2D(128, (3, 3), activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.25),
            
            layers.Flatten(),
            layers.Dense(256, activation='relu'),
            layers.Dropout(0.5),
            layers.Dense(self.num_classes, activation='softmax')
        ])
        
        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        self.model = model
        return model
    
    def train(self, X_train, y_train, X_val, y_val, epochs=50):
        """Train the model"""
        if self.model is None:
            self.build_cnn_model()
        
        # Data augmentation
        datagen = tf.keras.preprocessing.image.ImageDataGenerator(
            rotation_range=10,
            width_shift_range=0.1,
            height_shift_range=0.1,
            zoom_range=0.1,
            horizontal_flip=True
        )
        
        history = self.model.fit(
            datagen.flow(X_train, y_train, batch_size=32),
            validation_data=(X_val, y_val),
            epochs=epochs,
            callbacks=[
                keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
                keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=5)
            ]
        )
        
        return history
    
    def save_model(self, path):
        """Save trained model"""
        if self.model:
            self.model.save(path)
            print(f"Model saved to {path}")
    
    def load_model(self, path):
        """Load trained model"""
        self.model = keras.models.load_model(path)
        print(f"Model loaded from {path}")


class AudioEmotionClassifier(EmotionClassifier):
    """Specialized class for audio emotion recognition"""
    
    def __init__(self, num_classes=8):
        super().__init__((216, 1), num_classes)  # 216 features from MFCC
    
    def build_lstm_model(self):
        """Build LSTM model for audio emotion recognition"""
        model = keras.Sequential([
            layers.Reshape((216, 1), input_shape=(216,)),
            
            layers.LSTM(128, return_sequences=True),
            layers.Dropout(0.3),
            
            layers.LSTM(64),
            layers.Dropout(0.3),
            
            layers.Dense(128, activation='relu'),
            layers.Dropout(0.3),
            
            layers.Dense(self.num_classes, activation='softmax')
        ])
        
        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        self.model = model
        return model


# Training script
def train_emotion_models():
    """Main training function"""
    
    # 1. Train FER2013 model (facial expressions)
    print("Training FER2013 facial emotion model...")
    fer_loader = FER2013Loader('./data/fer2013')
    
    # Load data (adjust path based on your dataset structure)
    (X_train, y_train), (X_test, y_test) = fer_loader.load_data_from_folders(
        './data/fer2013/train',
        './data/fer2013/test'
    )
    
    facial_model = EmotionClassifier((48, 48, 1), 7)
    facial_model.build_cnn_model()
    facial_model.train(X_train, y_train, X_test, y_test, epochs=30)
    facial_model.save_model('./models/facial_emotion_model.h5')
    
    # 2. Train RAVDESS model (speech emotions)
    print("\nTraining RAVDESS speech emotion model...")
    ravdess_loader = RAVDESSLoader('./data/ravdess')
    X_audio, y_audio = ravdess_loader.load_data()
    
    # Convert labels to categorical
    y_audio_cat = tf.keras.utils.to_categorical(y_audio, num_classes=8)
    
    # Split data
    split_idx = int(0.8 * len(X_audio))
    X_train, X_test = X_audio[:split_idx], X_audio[split_idx:]
    y_train, y_test = y_audio_cat[:split_idx], y_audio_cat[split_idx:]
    
    audio_model = AudioEmotionClassifier(num_classes=8)
    audio_model.build_lstm_model()
    audio_model.train(X_train, y_train, X_test, y_test, epochs=40)
    audio_model.save_model('./models/speech_emotion_model.h5')
    
    print("✅ All models trained successfully!")

if __name__ == "__main__":
    train_emotion_models()