import subprocess
import time
import sys
import os

def main():
    print("🚀 Starting FastAPI server...")
    
    # Start the server in background
    server_process = subprocess.Popen([sys.executable, "REC_AGENT/api.py"])
    
    # Wait for server to start
    print("⏳ Waiting for server to start...")
    time.sleep(5)
    
    try:
        # Run the test
        print("🧪 Running chatbot test...")
        test_process = subprocess.run([sys.executable, "REC_AGENT/test_chatbot.py"])
        
        if test_process.returncode == 0:
            print("✅ Test completed successfully!")
        else:
            print("❌ Test failed!")
            
    finally:
        # Stop the server
        print("🛑 Stopping server...")
        server_process.terminate()
        server_process.wait()

if __name__ == "__main__":
    main() 