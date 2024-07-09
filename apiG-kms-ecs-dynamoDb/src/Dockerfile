# Use the official Python 3.8 slim image as the base image
FROM python:3.8-slim

# Set the working directory within the container
WORKDIR /src

# Copy necessary files and directories into the container
COPY app.py requirements.txt /src/


# Upgrade pip and install Python dependencies
RUN pip3 install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Expose port 5000 for the Flask application
EXPOSE 8888

# Define the command to run the Flask application using Gunicorn
#CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0:8888"]

CMD flask run --host=0.0.0.0 --port=8888