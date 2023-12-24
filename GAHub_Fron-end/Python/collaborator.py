#!/usr/bin/python3
class Project:
    def __init__(self, name, description):
        self.name = name
        self.description = description
        self.collaborators = []

    def add_collaborator(self, collaborator):
        if collaborator not in self.collaborators:
            self.collaborators.append(collaborator)
            collaborator.projects.append(self)

    def remove_collaborator(self, collaborator):
        if collaborator in self.collaborators:
            self.collaborators.remove(collaborator)
            collaborator.projects.remove(self)


class Collaborator:
    def __init__(self, name):
        self.name = name
        self.projects = []

    def add_project(self, project):
        if project not in self.projects:
            self.projects.append(project)
            project.collaborators.append(self)

    def remove_project(self, project):
        if project in self.projects:
            self.projects.remove(project)
            project.collaborators.remove(self)
