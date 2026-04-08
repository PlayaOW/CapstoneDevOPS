# Installing Ansible
## Reference
```txt
* Ansible Tutorial: https://www.youtube.com/watch?v=FPU9_KDTa8A&list=PLT98CRl2KxKEUHie1m24-wkyHpEsa4Y70&index=5
* Ansible Documentation: https://docs.ansible.com/projects/ansible/latest/
```
- ```shell
sudo apt update && sudo apt upgrade -y
sudo apt install ansible
```
- Then create an inventory file; inventory.ini or inventory.yml
- Inside of an inventory file you can type in the IP addresses of servers you are controlling or their DNS names.
- ```shell
ansible all --key-file path/to/ssh/key -i inventory.ini -m ping
```
- Now instead of writing all these ansible commands, we can create a ansible config file.
- Typically named ansible.cfg
- Typically would have:
- ```yml
 inventory = inventory.yml
 private_key_file = /path/to/ssh/privKey
```
- But if you are not running any config files and automating tasks within the inventory file (which is also possible), in that case, you have to specify which file you are using as your inventory. Such as, if your inventory file name is: inventory.ini and it looks like this.
```yml
[webserver]
192.168.x.x ansible_user=userName ansible_ssh_private_key_file=/path/to/ssh/keyPair
```
- Then you would run:
```shell
ansible all -i inventory.ini -m ping
# To test out whether ansible can reach those machines.
# syntax
# ansible all -i path or name of inventory file -m name_of_modules
```
- **ad hoc** commands are one time ansible commands that are executed on the shell to initiate, ping managed nodes. These commands are executed to accomplish a single task on managed nodes without writing an entire playbook.
- Often times, when one wants to make any changes to the server, they need to have elevated privileges or run commands using sudo.
- How to run a command that requires elevated privilege on your managed node:
```shell
ansible all -i inventory.yml-m apt -a update_cache-true --become --ask-become-pass -l IP_address_managed_nodes
# Exclude -l option if the operation is intended for all machines inside of inventory
# ansible - INvokes Ansible CLI to execute a command
# all means all hosts in the inventory
# -i specifies the inventory file
# -a "update_cache=true" Args passed to apt module, this tells Ansible to run apt update and refresh the local package index.
--become enables privilege escalation
--ask-become-pass prompts the sudo password interactively. 
```
- "--ask-become-pass" can be avoided if SSH key pairs are used to let ansible access the managed node.
- ## Ansible PlayBooks
- Typically playbooks are written using YAML format, such as nameOfPlkaybook.yml
-  Example of Typical Ansible Playbook:
```yml
- hosts: all or [groupName]
    become: true or false # Depends on whether the operations requires elevated privilege
    tasks:
    -name: Anything descriptive regarding the task
     apt:		# Typically add the module you want to use it could be
				# apt or ping or anything else..
	  name: apache2
```
- Playbooks are typically used for configuring entire servers and install all dependencies and tools needed, so most of the time the playbooks you would come across would have more tasks.
- 