import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd
from datetime import datetime
import os

# Set style
plt.style.use('seaborn')
sns.set_palette("husl")

# Create results directory if it doesn't exist
os.makedirs('results/graphs', exist_ok=True)

# Sample data (replace with actual data)
detection_data = {
    'Frame': range(1, 101),
    'Gun_Confidence': np.random.normal(0.92, 0.05, 100),
    'Knife_Confidence': np.random.normal(0.87, 0.07, 100)
}

# Create DataFrame
df = pd.DataFrame(detection_data)

# 1. Detection Confidence Over Time
plt.figure(figsize=(12, 6))
plt.plot(df['Frame'], df['Gun_Confidence'], label='Gun', linewidth=2)
plt.plot(df['Frame'], df['Knife_Confidence'], label='Knife', linewidth=2)
plt.title('Detection Confidence Over Time', fontsize=14)
plt.xlabel('Frame Number', fontsize=12)
plt.ylabel('Confidence Score', fontsize=12)
plt.legend(fontsize=12)
plt.grid(True, alpha=0.3)
plt.savefig('results/graphs/confidence_over_time.png', dpi=300, bbox_inches='tight')
plt.close()

# 2. Confusion Matrix
confusion_matrix = np.array([
    [94, 3],
    [5, 89]
])
plt.figure(figsize=(8, 6))
sns.heatmap(confusion_matrix, annot=True, fmt='d', cmap='Blues',
            xticklabels=['Predicted Gun', 'Predicted Knife'],
            yticklabels=['Actual Gun', 'Actual Knife'])
plt.title('Confusion Matrix', fontsize=14)
plt.savefig('results/graphs/confusion_matrix.png', dpi=300, bbox_inches='tight')
plt.close()

# 3. Processing Speed Analysis
processing_times = np.random.normal(33, 5, 100)  # ms per frame
plt.figure(figsize=(10, 6))
plt.hist(processing_times, bins=20, edgecolor='black')
plt.title('Frame Processing Time Distribution', fontsize=14)
plt.xlabel('Processing Time (ms)', fontsize=12)
plt.ylabel('Frequency', fontsize=12)
plt.grid(True, alpha=0.3)
plt.savefig('results/graphs/processing_time_distribution.png', dpi=300, bbox_inches='tight')
plt.close()

# 4. Detection Performance by Class
performance_data = {
    'Metric': ['Precision', 'Recall', 'F1 Score'] * 2,
    'Value': [0.95, 0.93, 0.94, 0.90, 0.88, 0.89],
    'Class': ['Gun'] * 3 + ['Knife'] * 3
}
df_perf = pd.DataFrame(performance_data)

plt.figure(figsize=(10, 6))
sns.barplot(x='Metric', y='Value', hue='Class', data=df_perf)
plt.title('Detection Performance by Class', fontsize=14)
plt.ylim(0, 1)
plt.grid(True, alpha=0.3)
plt.savefig('results/graphs/performance_by_class.png', dpi=300, bbox_inches='tight')
plt.close()

# 5. Resource Utilization
time_points = range(1, 101)
gpu_util = np.random.normal(87.5, 2.5, 100)
cpu_util = np.random.normal(45, 5, 100)

plt.figure(figsize=(12, 6))
plt.plot(time_points, gpu_util, label='GPU', linewidth=2)
plt.plot(time_points, cpu_util, label='CPU', linewidth=2)
plt.title('Resource Utilization Over Time', fontsize=14)
plt.xlabel('Time (s)', fontsize=12)
plt.ylabel('Utilization (%)', fontsize=12)
plt.legend(fontsize=12)
plt.grid(True, alpha=0.3)
plt.savefig('results/graphs/resource_utilization.png', dpi=300, bbox_inches='tight')
plt.close()

print("Graphs generated successfully in results/graphs/ directory") 