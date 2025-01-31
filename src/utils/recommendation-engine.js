async updatePreferences(userId, preferences) {
    const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
    await dbAsync.run(`
      INSERT OR REPLACE INTO matching_preferences     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
      (user_id, preferred_industries, min_experience, max_experience, preferred_meeting_frequency)
      VALUES (?, ?, ?, ?, ?)
      const mentors = await dbAsync.all(query, [userProfile.years_experience, userProfile.user_id]);
      return this.calculateMatchScores(mentors, userProfile, userSkills);
const { dbAsync } = require('../config/database');
const UserModel = require('../models/user.model');
const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
const SkillModel = require('../models/skill.model');
calculateMatchScores(matches, userProfile, userSkills) {
    const userSkillNames = new Set(userSkills.map(s => s.name.toLowerCase()));
    return matches.map(match => {
      const matchSkills = match.skill_names ? match.skill_names.split(',') : [];
      const skillMatchCount = matchSkills.filter(skill => 
        userSkillNames.has(skill.toLowerCase())
      ).length;     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
      const experienceScore = Math.min(100, 
        Math.abs(match.years_experience - userProfile.years_experience) <= 5 ? 100 : 
        Math.abs(match.years_experience - userProfile.years_experience) <= 10 ? 70 : 50
      );     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
      const skillScore = Math.min(100, (skillMatchCount / Math.max(userSkillNames.size, 1)) * 100);
      const totalScore = (skillScore * 0.6) + (experienceScore * 0.4);
class MatchingService {  const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
  async findMatches(userId) {
    const mentees = await dbAsync.all(query, [userProfile.years_experience, userProfile.user_id]);
    return this.calculateMatchScores(mentees, userProfile, userSkills);
  } const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
  calculateMatchScores(matches, userProfile, userSkills) {
    const userSkillNames = new Set(userSkills.map(s => s.name.toLowerCase()));
    return matches.map(match => {
      const matchSkills = match.skill_names ? match.skill_names.split(',') : [];
      const skillMatchCount = matchSkills.filter(skill => 
        userSkillNames.has(skill.toLowerCase())
      ).length;      const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
      const experienceScore = Math.min(100, 
        Math.abs(match.years_experience - userProfile.years_experience) <= 5 ? 100 : 
        Math.abs(match.years_experience - userProfile.years_experience) <= 10 ? 70 : 50
      );   const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
      const skillScore = Math.min(100, (skillMatchCount / Math.max(userSkillNames.size, 1)) * 100)
    try {     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
      // Get user data  const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
      const user = await UserModel.findById(userId);
      const userProfile = await ProfileModel.findByUserId(userId);
      const userSkills = await SkillModel.getUserSkills(userId);     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
      if (!user || !userProfile) {     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
        throw new Error('User profile not found');
      }     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
      let potentialMatches = [];
      async updatePreferences(userId, preferences) {
        const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
        await dbAsync.run(`
          INSERT OR REPLACE INTO matching_preferences     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
          (user_id, preferred_industries, min_experience, max_experience, preferred_meeting_frequency)
          VALUES (?, ?, ?, ?, ?)
          const mentors = await dbAsync.all(query, [userProfile.years_experience, userProfile.user_id]);
          return this.calculateMatchScores(mentors, userProfile, userSkills);
    const { dbAsync } = require('../config/database');
    const UserModel = require('../models/user.model');
    const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
    const SkillModel = require('../models/skill.model');
    calculateMatchScores(matches, userProfile, userSkills) {
        const userSkillNames = new Set(userSkills.map(s => s.name.toLowerCase()));
        return matches.map(match => {
          const matchSkills = match.skill_names ? match.skill_names.split(',') : [];
          const skillMatchCount = matchSkills.filter(skill => 
            userSkillNames.has(skill.toLowerCase())
          ).length;     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
          const experienceScore = Math.min(100, 
            Math.abs(match.years_experience - userProfile.years_experience) <= 5 ? 100 : 
            Math.abs(match.years_experience - userProfile.years_experience) <= 10 ? 70 : 50
          );     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
          const skillScore = Math.min(100, (skillMatchCount / Math.max(userSkillNames.size, 1)) * 100);
          const totalScore = (skillScore * 0.6) + (experienceScore * 0.4);
    class MatchingService {          try {     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
    // Get user data const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
      async findMatches(userId) {         try {     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
      // Get user data const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
        try {     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
          // Get user data const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
          const user = await UserModel.findById(userId);
          const userProfile = await ProfileModel.findByUserId(userId);
          const userSkills = await SkillModel.getUserSkills(userId);     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
          if (!user || !userProfile) {     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
            throw new Error('User profile not found');
          }     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
          let potentialMatches = [];
          async updatePreferences(userId, preferences) {
            const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
            await dbAsync.run(`
              INSERT OR REPLACE INTO matching_preferences     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
              (user_id, preferred_industries, min_experience, max_experience, preferred_meeting_frequency)
              VALUES (?, ?, ?, ?, ?)
              const mentors = await dbAsync.all(query, [userProfile.years_experience, userProfile.user_id]);
              return this.calculateMatchScores(mentors, userProfile, userSkills);
        const { dbAsync } = require('../config/database');
        const UserModel = require('../models/user.model');
        const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
        const SkillModel = require('../models/skill.model');
        calculateMatchScores(matches, userProfile, userSkills) {
            const userSkillNames = new Set(userSkills.map(s => s.name.toLowerCase()));
            return matches.map(match => {
              const matchSkills = match.skill_names ? match.skill_names.split(',') : [];
              const skillMatchCount = matchSkills.filter(skill => 
                userSkillNames.has(skill.toLowerCase())
              ).length;     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
              const experienceScore = Math.min(100, 
                Math.abs(match.years_experience - userProfile.years_experience) <= 5 ? 100 : 
                Math.abs(match.years_experience - userProfile.years_experience) <= 10 ? 70 : 50
              );     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
              const skillScore = Math.min(100, (skillMatchCount / Math.max(userSkillNames.size, 1)) * 100);
              const totalScore = (skillScore * 0.6) + (experienceScore * 0.4);
        class MatchingService {  const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
          async findMatches(userId) {
            const mentees = await dbAsync.all(query, [userProfile.years_experience, userProfile.user_id]);
            return this.calculateMatchScores(mentees, userProfile, userSkills);
          } const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
          calculateMatchScores(matches, userProfile, userSkills) {
            const userSkillNames = new Set(userSkills.map(s => s.name.toLowerCase()));
            return matches.map(match => {
              const matchSkills = match.skill_names ? match.skill_names.split(',') : [];
              const skillMatchCount = matchSkills.filter(skill => 
                userSkillNames.has(skill.toLowerCase())
              ).length;      const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
              const experienceScore = Math.min(100, 
                Math.abs(match.years_experience - userProfile.years_experience) <= 5 ? 100 : 
                Math.abs(match.years_experience - userProfile.years_experience) <= 10 ? 70 : 50
              );   const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
              const skillScore = Math.min(100, (skillMatchCount / Math.max(userSkillNames.size, 1)) * 100)
            try {     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
              // Get user data  const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
              const user = await UserModel.findById(userId);
              const userProfile = await ProfileModel.findByUserId(userId);
              const userSkills = await SkillModel.getUserSkills(userId);     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
              if (!user || !userProfile) {     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
                throw new Error('User profile not found');
              }     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
              let potentialMatches = [];
              async updatePreferences(userId, preferences) {
                const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
                await dbAsync.run(`
                  INSERT OR REPLACE INTO matching_preferences     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
                  (user_id, preferred_industries, min_experience, max_experience, preferred_meeting_frequency)
                  VALUES (?, ?, ?, ?, ?)
                  const mentors = await dbAsync.all(query, [userProfile.years_experience, userProfile.user_id]);
                  return this.calculateMatchScores(mentors, userProfile, userSkills);
            const { dbAsync } = require('../config/database');
            const UserModel = require('../models/user.model');
            const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
            const SkillModel = require('../models/skill.model');
            calculateMatchScores(matches, userProfile, userSkills) {
                const userSkillNames = new Set(userSkills.map(s => s.name.toLowerCase()));
                return matches.map(match => {
                  const matchSkills = match.skill_names ? match.skill_names.split(',') : [];
                  const skillMatchCount = matchSkills.filter(skill => 
                    userSkillNames.has(skill.toLowerCase())
                  ).length;     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
                  const experienceScore = Math.min(100, 
                    Math.abs(match.years_experience - userProfile.years_experience) <= 5 ? 100 : 
                    Math.abs(match.years_experience - userProfile.years_experience) <= 10 ? 70 : 50
                  );     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
                  const skillScore = Math.min(100, (skillMatchCount / Math.max(userSkillNames.size, 1)) * 100);
                  const totalScore = (skillScore * 0.6) + (experienceScore * 0.4);
            class MatchingService {          try {     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
            // Get user data const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
              async findMatches(userId) {         try {     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
              // Get user data const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
                try {     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
                  // Get user data const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
                  const user = await UserModel.findById(userId);
                  const userProfile = await ProfileModel.findByUserId(userId);
                  const userSkills = await SkillModel.getUserSkills(userId);     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
                  if (!user || !userProfile) {     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
                    throw new Error('User profile not found');
                  }     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
                  let potentialMatches = [];async updatePreferences(userId, preferences) {
                    const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
                    await dbAsync.run(`
                      INSERT OR REPLACE INTO matching_preferences     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
                      (user_id, preferred_industries, min_experience, max_experience, preferred_meeting_frequency)
                      VALUES (?, ?, ?, ?, ?)
                      const mentors = await dbAsync.all(query, [userProfile.years_experience, userProfile.user_id]);
                      return this.calculateMatchScores(mentors, userProfile, userSkills);
                const { dbAsync } = require('../config/database');
                const UserModel = require('../models/user.model');
                const ProfileModel = require('../models/profile.model');     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
                const SkillModel = require('../models/skill.model');
                calculateMatchScores(matches, userProfile, userSkills) {
                    const userSkillNames = new Set(userSkills.map(s => s.name.toLowerCase()));
                    return matches.map(match => {
                      const matchSkills = match.skill_names ? match.skill_names.split(',') : [];
                      const skillMatchCount = matchSkills.filter(skill => 
                        userSkillNames.has(skill.toLowerCase())
                      ).length;     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
                      const experienceScore = Math.min(100, 
                        Math.abs(match.years_experience - userProfile.years_experience) <= 5 ? 100 : 
                        Math.abs(match.years_experience - userProfile.years_experience) <= 10 ? 70 : 50
                      );     const { preferred_industries, min_experience, max_experience, preferred_meeting_frequency } = preferences;
                      const skillScore = Math.min(100, (skillMatchCount / Math.max(userSkillNames.size, 1)) * 100);
                      const totalScore = (skillScore * 0.6) + (experienceScore * 0.4);
                class MatchingSer>>)})}`)}}}}}}>>)})}`)}}>>)})}}>>)})}`)}}}}}}>>)})}`)}}>>)})}}>>)})}`)}