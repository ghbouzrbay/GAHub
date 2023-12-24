from flask import Flask, render_template, request
from collaboration import Project, Collaborator

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/create_project', methods=['POST'])
def create_project():
    project_name = request.form['project_name']
    project_description = request.form['project_description']
    new_project = Project(project_name, project_description)
    # add the new project to the list of projects
    return render_template('index.html')

@app.route('/create_collaborator', methods=['POST'])
def create_collaborator():
    collaborator_name = request.form['collaborator_name']
    new_collaborator = Collaborator(collaborator_name)
    # add the new collaborator to the list of collaborators
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
