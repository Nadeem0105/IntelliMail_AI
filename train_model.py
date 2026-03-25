import pandas as pd
import urllib.request
import zipfile
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

def download_dataset():
    url = "https://archive.ics.uci.edu/ml/machine-learning-databases/00228/smsspamcollection.zip"
    zip_path = "smsspamcollection.zip"
    extract_dir = "data"
    
    if not os.path.exists(extract_dir):
        os.makedirs(extract_dir)

    print("Downloading dataset...")
    urllib.request.urlretrieve(url, zip_path)
    
    print("Extracting dataset...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)
        
    os.remove(zip_path)
    print("Dataset ready in data/SMSSpamCollection")

def train_and_save_model():
    data_path = os.path.join("data", "SMSSpamCollection")
    if not os.path.exists(data_path):
        download_dataset()

    print("Loading data...")
    # SMS Spam Collection is tab-separated: label \t text
    df = pd.read_csv(data_path, sep='\t', header=None, names=['label', 'text'])
    
    df['label_num'] = df['label'].map({'ham': 0, 'spam': 1})
    
    X = df['text']
    y = df['label_num']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Naive Bayes Model with TF-IDF...")
    model = make_pipeline(TfidfVectorizer(stop_words='english'), MultinomialNB())
    model.fit(X_train, y_train)
    
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    print(f"Model Accuracy: {accuracy * 100:.2f}%")
    print("Classification Report:")
    print(classification_report(y_test, predictions, target_names=['ham', 'spam']))
    
    print("Saving model to data/spam_classifier_model.pkl...")
    joblib.dump(model, os.path.join("data", "spam_classifier_model.pkl"))
    print("Done!")

if __name__ == "__main__":
    train_and_save_model()
