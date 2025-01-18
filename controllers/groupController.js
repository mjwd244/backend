const Group = require('../models/Group');
const mongoose = require('mongoose');

const checkUsersituationIngroup = async (req, res) =>{

     try {
        const { groupId, userId } = req.params;      // Assuming groupId is sent in the request body


    const group = await Group.findById(groupId);

    if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
  
  
    if (group.createdBy.toString() === userId) {
        return res.status(200).json({ message: 'User is the creator of the group' });
      } else {
        return res.status(403).json({ message: 'User is not the creator of the group' });
      }
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
      }
};


const removeUserFromGroup = async (req, res) => {
    try {
      const { userId,groupId } = req.params; // Extract groupId and userId from URL parameters
      console.log(`Received request to remove user ${userId} from group ${groupId}`);
      console.log('Request parameters:', req.params);

      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        console.log('Invalid groupId:', groupId);
        return res.status(400).json({ message: 'Invalid group ID' });
      }
  
      const group = await Group.findById(groupId);
      if (!group) {
        console.log('Group not found');
        return res.status(404).json({ message: 'Group not found' });
      }
      console.log('Group found:', group);
  
      // Check if the user is a participant in the group
      if (!group.userIds.includes(userId)) {
        console.log('User not found in the group');
        return res.status(404).json({ message: 'User not found in the group' });
      }
      console.log('User found in the group');
  
      // Remove the user from the group
      group.userIds = group.userIds.filter(id => id.toString() !== userId);
      await group.save();
      console.log(`User ${userId} removed from group ${groupId}`);
  
      res.status(200).json({ message: 'User removed from the group' });
    } catch (error) {
      console.error('Error removing user from group:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };

  const deleteGroupController = async (req, res) => {
    try {
      const { groupId } = req.params;
      const group = await Group.findByIdAndDelete(groupId);
      if (!group) {
        return res.status(404).send({ message: 'Group not found' });
      }
      res.send({ message: 'Group deleted successfully' });
    } catch (error) {
      console.error('Error deleting group:', error);
      res.status(500).send({ message: 'Internal Server Error' });
    }
  };
    



module.exports = {
    checkUsersituationIngroup,
    removeUserFromGroup,
    deleteGroupController
    // other exports
  };