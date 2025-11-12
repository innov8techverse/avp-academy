import { Response } from "express";
import { prisma } from "../config/database";
import { AuthRequest } from "../types";
import { hashPassword } from "../utils/password";
import { logger } from "../config/logger";
import EmailService from "../services/emailService";
import crypto from "crypto";

// Student Management
export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const {
      email,
      full_name,
      phone_number,
      batch_id,
      course_id,
      address,
      emergency_contact,
      date_of_birth,
      gender,
      city,
      state,
      pincode,
      adhaar_num,
      enrollment_number,
      qualification,
      guardian_name,
      guardian_contact,
      guardian_email,
      guardian_relation,
      mobile_number,
      bio,
      blood_group,
      medical_conditions,
  community,
    } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    // Email uniqueness check (case-insensitive)
    const existingEmail = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } }
    });
    if (existingEmail) {
      res.status(400).json({ success: false, message: 'Email already exists, try another email' });
      return;
    }

    // Generate random password
    const randomPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await hashPassword(randomPassword);

    // Creating user
    const student = await prisma.user.create({
      data: {
        email,
        full_name,
        phone_number,
        password: hashedPassword,
        city,
        gender,
        state,
        pincode,
        role: "STUDENT",
        student_profile: {
          create: {
            batch_id: batch_id ? parseInt(batch_id, 10) : undefined,
            course_id: course_id ? parseInt(course_id, 10) : undefined,
            address,
            date_of_birth:new Date(date_of_birth),
            adhaar_num,
            enrollment_number: enrollment_number,
            qualification,
            guardian_name,
            guardian_contact,
            guardian_email,
            guardian_relation,
            mobile_number,
            bio,
            blood_group,
            medical_conditions,
            emergency_contact,
            community,
          } as any,
        },
      },
      include: {
        student_profile: {
          include: {
            batch: true,
            course: true,
          },
        },
      },
    });

    // Send onboarding email to the new student
    try {
      await EmailService.sendUserOnboardingEmail(student);
      logger.info(`Onboarding email sent to new student: ${student.email}`);
    } catch (emailError) {
      logger.error('Failed to send onboarding email to student:', emailError);
      // Don't fail the student creation if email fails
    }

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: { ...student, tempPassword: randomPassword },
    });
  } catch (error) {
    logger.error("Create student error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create student" });
  }
};

export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { search, batch_id, course_id } = req.query;

    const where: any = { role: "STUDENT" };

    if (search) {
      where.OR = [
        { full_name: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (batch_id || course_id) {
      where.student_profile = {};
      if (batch_id)
        where.student_profile.batch_id = parseInt(batch_id as string);
      if (course_id)
        where.student_profile.course_id = parseInt(course_id as string);
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          student_profile: {
            include: {
              batch: true,
              course: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: students,
      meta: {
        total,
      },
    });
  } catch (error) {
    logger.error("Get students error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch students" });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = parseInt(id);

    if (isNaN(studentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
      return;
    }

    const {
      full_name,
      email,
      phone_number,
      batch_id,
      course_id,
      address,
      emergency_contact,
      date_of_birth,
      gender,
      city,
      state,
      pincode,
      is_active,
      adhaar_num,
      enrollment_number,
      qualification,
      guardian_name,
      guardian_contact,
      guardian_email,
      guardian_relation,
      mobile_number,
      bio,
      blood_group,
      medical_conditions,
      achievements,
      documents
  ,community
    } = req.body;

    // If email provided, ensure uniqueness (case-insensitive) excluding current student
    if (email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: { equals: email, mode: 'insensitive' },
          NOT: { user_id: studentId }
        }
      });
      if (existing) {
        res.status(400).json({ success: false, message: 'Email already exists, try another email' });
        return;
      }
    }

    // Build the user data update object
    const userData: any = {};
    if (full_name !== undefined) userData.full_name = full_name;
    if (email !== undefined) userData.email = email;
    if (phone_number !== undefined) userData.phone_number = phone_number;
    if (gender !== undefined) userData.gender = gender;
    if (city !== undefined) userData.city = city;
    if (state !== undefined) userData.state = state;
    if (pincode !== undefined) userData.pincode = pincode;
    if (is_active !== undefined) userData.is_active = is_active;

    // Build the student profile data update object
    const profileData: any = {};
    if (batch_id !== undefined) profileData.batch_id = batch_id ? parseInt(batch_id) : null;
    if (course_id !== undefined) profileData.course_id = course_id ? parseInt(course_id) : null;
    if (address !== undefined) profileData.address = address;
    if (emergency_contact !== undefined) profileData.emergency_contact = emergency_contact;
    if (date_of_birth !== undefined) profileData.date_of_birth = date_of_birth ? new Date(date_of_birth) : null;
    if (adhaar_num !== undefined) profileData.adhaar_num = adhaar_num;
    if (enrollment_number !== undefined) profileData.enrollment_number = enrollment_number;
    if (qualification !== undefined) profileData.qualification = qualification;
    if (guardian_name !== undefined) profileData.guardian_name = guardian_name;
    if (guardian_contact !== undefined) profileData.guardian_contact = guardian_contact;
    if (guardian_email !== undefined) profileData.guardian_email = guardian_email;
    if (guardian_relation !== undefined) profileData.guardian_relation = guardian_relation;
    if (mobile_number !== undefined) profileData.mobile_number = mobile_number;
    if (bio !== undefined) profileData.bio = bio;
    if (blood_group !== undefined) profileData.blood_group = blood_group;
    if (medical_conditions !== undefined) profileData.medical_conditions = medical_conditions;
    if (achievements !== undefined) profileData.achievements = achievements;
    if (documents !== undefined) profileData.documents = documents;
  if (community !== undefined) profileData.community = community;

    // Only include student_profile update if there are profile fields to update
    if (Object.keys(profileData).length > 0) {
      userData.student_profile = {
        update: profileData
      };
    }

    console.log('Updating student with userData:', userData);

    const student = await prisma.user.update({
      where: { user_id: studentId },
      data: userData,
      include: {
        student_profile: {
          include: {
            batch: true,
            course: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  } catch (error) {
    logger.error("Update student error:", error);
    console.error("Update student detailed error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update student" });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = parseInt(id);

    if (isNaN(studentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
      return;
    }

    await prisma.user.delete({
      where: { user_id: studentId },
    });

    res.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    logger.error("Delete student error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete student" });
  }
};

  export const bulkDisableStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { student_ids } = req.body;

    // Validate input
    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      res.status(400).json({
        success: false,
        message: "student_ids array is required and must not be empty",
      });
      return;
    }

    // Convert all IDs to numbers and validate
    const studentIds = student_ids.map((id: any) => {
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;
      if (isNaN(numId)) {
        return null;
      }
      return numId;
    }).filter((id: number | null) => id !== null) as number[];

    if (studentIds.length === 0) {
      res.status(400).json({
        success: false,
        message: "No valid student IDs provided",
      });
      return;
    }

    // Bulk update all students to disable them
    const result = await prisma.user.updateMany({
      where: {
        user_id: { in: studentIds },
        role: "STUDENT",
      },
      data: {
        is_active: false,
      },
    });

    logger.info(`Bulk disabled ${result.count} students`);

    res.json({
      success: true,
      message: `Successfully disabled ${result.count} student(s)`,
      data: {
        disabled_count: result.count,
      },
    });
  } catch (error) {
    logger.error("Bulk disable students error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to disable students" });
  }
};

// Course Management
export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, duration, fees, status } = req.body;
    // Parse fees (schema expects Int?)
    let feesValue: number | null = null;
    if (fees !== undefined && fees !== null && fees !== '') {
      const n = typeof fees === 'number' ? fees : parseInt(fees, 10);
      if (Number.isNaN(n)) {
        res.status(400).json({ success: false, message: 'Invalid fees value' });
        return; // early exit
      }
      feesValue = n;
    }

  const course = await (prisma as any).course.create({
      data: {
        name,
        description,
        duration: duration ? duration.toString() : null,
    fees: feesValue as any,
        status: status ? "ACTIVE" : "DRAFT",
      },
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    logger.error("Create course error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create course" });
  }
};

export const getCourses = async (_: AuthRequest, res: Response) => {
  try {
    // Using any casts to avoid issues if Prisma client is out-of-sync; recommend running `npx prisma generate`.
    const courses = await (prisma as any).course.findMany({
      include: {
        batches: true,
        students: true,
        subjects: true,
      },
      orderBy: { created_at: 'desc' } as any,
    });

    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    logger.error("Get courses error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch courses" });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);

    if (isNaN(courseId)) {
      res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
      return;
    }

    const { name, description, duration, fees, status} = req.body;

    let feesValue: number | null = null;
    if (fees !== undefined && fees !== null && fees !== '') {
      const n = typeof fees === 'number' ? fees : parseInt(fees, 10);
      if (Number.isNaN(n)) {
        res.status(400).json({ success: false, message: 'Invalid fees value' });
        return; // early exit
      }
      feesValue = n;
    }

  const course = await (prisma as any).course.update({
      where: { course_id: courseId },
      data: {
        name,
        description,
        duration: duration ? duration.toString() : null,
    fees: feesValue as any,
        status: status ? "ACTIVE" : "INACTIVE",
      },
    });

    res.json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    logger.error("Update course error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update course" });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);

    if (isNaN(courseId)) {
      res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
      return;
    }

    await prisma.course.delete({
      where: { course_id: courseId },
    });

    res.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    logger.error("Delete course error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete course" });
  }
};

export const getCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);
    if (isNaN(courseId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid course ID" });
    }
    const course = await prisma.course.findUnique({
      where: { course_id: courseId },
      include: { subjects: true },
    });
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }
    return res.json({ success: true, data: course });
  } catch (error) {
    logger.error("Get course error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch course" });
  }
};

// Batch Management
export const createBatch = async (req: AuthRequest, res: Response) => {
  try {
    const {
      batch_name,
      capacity,
      course_id,
      start_date,
      end_date,
      description,
      is_active,
    } = req.body;

    const batch = await prisma.batch.create({
      data: {
        batch_name,
        capacity: capacity ? parseInt(capacity) : 0,
        course_id: course_id ? parseInt(course_id) : null,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        description,
        is_active: is_active !== false,
      },
    });

    res.status(201).json({
      success: true,
      message: "Batch created successfully",
      data: batch,
    });
  } catch (error) {
    logger.error("Create batch error:", error);
    res.status(500).json({ success: false, message: "Failed to create batch" });
  }
};

export const getBatches = async (req: AuthRequest, res: Response) => {
  try {
    const { course_id } = req.query;
    const where = course_id
      ? { course_id: parseInt(course_id as string) }
      : undefined;

    const batches = await prisma.batch.findMany({
      where,
      include: {
        course: true,
        students: true,
      },
      orderBy: { created_at: "desc" },
    });

    res.json({
      success: true,
      data: batches,
    });
  } catch (error) {
    logger.error("Get batches error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch batches" });
  }
};

export const updateBatch = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const batchId = parseInt(id);

    if (isNaN(batchId)) {
      res.status(400).json({
        success: false,
        message: "Invalid batch ID",
      });
      return;
    }

    const {
      batch_name,
      capacity,
      course_id,
      start_date,
      end_date,
      description,
      is_active,
    } = req.body;

    const batch = await prisma.batch.update({
      where: { batch_id: batchId },
      data: {
        batch_name,
        capacity: capacity ? parseInt(capacity) : undefined,
        course_id: course_id ? parseInt(course_id) : undefined,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        description,
        is_active,
      },
      include: {
        course: true,
        students: true,
      },
    });

    res.json({
      success: true,
      message: "Batch updated successfully",
      data: batch,
    });
  } catch (error) {
    logger.error("Update batch error:", error);
    res.status(500).json({ success: false, message: "Failed to update batch" });
  }
};

export const deleteBatch = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const batchId = parseInt(id);

    if (isNaN(batchId)) {
      res.status(400).json({
        success: false,
        message: "Invalid batch ID",
      });
      return;
    }

    // First, remove all student associations
    await prisma.studentProfile.updateMany({
      where: { batch_id: batchId },
      data: { batch_id: null },
    });

    // Then delete the batch
    await prisma.batch.delete({
      where: { batch_id: batchId },
    });

    res.json({
      success: true,
      message: "Batch deleted successfully",
    });
  } catch (error) {
    logger.error("Delete batch error:", error);
    res.status(500).json({ success: false, message: "Failed to delete batch" });
  }
};

export const updateBatchStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const batchId = parseInt(id);
    const { student_ids } = req.body;

    if (isNaN(batchId)) {
      res.status(400).json({
        success: false,
        message: "Invalid batch ID",
      });
      return;
    }

    // Remove all current student associations with this batch
    await prisma.studentProfile.updateMany({
      where: { batch_id: batchId },
      data: { batch_id: null },
    });

    // Add new student associations
    if (student_ids && student_ids.length > 0) {
      await prisma.studentProfile.updateMany({
        where: {
          user_id: {
            in: student_ids,
          },
        },
        data: { batch_id: batchId },
      });
    }

    res.json({
      success: true,
      message: "Batch students updated successfully",
    });
  } catch (error) {
    logger.error("Update batch students error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update batch students" });
  }
};

// Staff Management
export const createStaff = async (req: AuthRequest, res: Response) => {
  try {
    const {
      email,
      full_name,
      phone_number,
      department,
      designation,
      qualifications,
      specialization,
      subjects,
  role,
  years_of_experience,
  salary,
  bank_details,
  documents,
  emergency_contact,
  blood_group,
  medical_conditions,
  achievements,
  performance_rating,
  office_location,
    } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    // Case-insensitive email uniqueness check (same as student logic)
    const existingEmail = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } }
    });
    if (existingEmail) {
      res.status(400).json({ success: false, message: 'Email already exists, try another email' });
      return;
    }

    // Generate random password
    const randomPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await hashPassword(randomPassword);

    // Only allow ADMIN or TEACHER, default TEACHER if invalid / missing
    const normalizedRole = (role === 'ADMIN' || role === 'TEACHER') ? role : 'TEACHER';

    const staff = await prisma.user.create({
      data: {
        email,
        full_name,
        phone_number,
        password: hashedPassword,
        role: normalizedRole,
        staff: {
          create: {
            department,
            designation,
            qualifications: qualifications || [],
            specialization: specialization || [],
            subjects: subjects || [],
            years_of_experience: years_of_experience ? parseInt(years_of_experience) : null,
            salary: salary ? parseFloat(salary) : null,
            bank_details,
            documents,
            emergency_contact,
            blood_group,
            medical_conditions,
            achievements,
            performance_rating: performance_rating ? parseFloat(performance_rating) : null,
            office_location,
          },
        },
      },
      include: {
        staff: true,
      },
    });

    // Send onboarding email to the new staff member
    try {
      await EmailService.sendUserOnboardingEmail(staff);
      logger.info(`Onboarding email sent to new staff member: ${staff.email}`);
    } catch (emailError) {
      logger.error('Failed to send onboarding email to staff member:', emailError);
      // Don't fail the staff creation if email fails
    }

    res.status(201).json({
      success: true,
      message: "Staff created successfully",
      data: { ...staff, tempPassword: randomPassword },
    });
  } catch (error) {
    logger.error("Create staff error:", error);
    res.status(500).json({ success: false, message: "Failed to create staff" });
  }
};

export const getStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;

    // Include both TEACHER and ADMIN roles in staff listing
    const where: any = { role: { in: ["TEACHER", "ADMIN"] } };

    if (search) {
      where.OR = [
        { full_name: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [staff, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          staff: true,
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    console.log(staff[0]);

    res.json({
      success: true,
      data: staff,
      meta: {
        total,
      },
    });
  } catch (error) {
    logger.error("Get staff error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch staff" });
  }
};

export const updateStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const staffId = parseInt(id);

    if (isNaN(staffId)) {
      res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
      return;
    }

    const {
      full_name,
      email,
      phone_number,
      role,
      department,
      designation,
      qualifications,
      years_of_experience,
      specialization,
      subjects,
      salary,
      bank_details,
      documents,
      emergency_contact,
      blood_group,
      medical_conditions,
      achievements,
      performance_rating,
      office_location,
      is_active,
    } = req.body;

    // Optional uniqueness check for email if changed (case-insensitive)
    if (email) {
      const existingEmail = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' }, NOT: { user_id: staffId } } });
      if (existingEmail) {
        res.status(400).json({ success: false, message: 'Email already exists, try another email' });
        return;
      }
    }

    const userData: any = {
      full_name,
      email,
      phone_number,
      role,
    };
    if (is_active !== undefined) userData.is_active = is_active;

    const staff = await prisma.user.update({
      where: { user_id: staffId },
      data: {
        ...userData,
        staff: {
          update: {
            department,
            designation,
            qualifications: qualifications || [],
            years_of_experience: years_of_experience
              ? parseInt(years_of_experience)
              : null,
            specialization: specialization || [],
            subjects: subjects || [],
            salary: salary ? parseFloat(salary) : null,
            bank_details,
            documents,
            emergency_contact,
            blood_group,
            medical_conditions,
            achievements,
            performance_rating: performance_rating
              ? parseFloat(performance_rating)
              : null,
            office_location,
          },
        },
      },
      include: {
        staff: true,
      },
    });

    res.json({
      success: true,
      message: "Staff updated successfully",
      data: staff,
    });
  } catch (error) {
    logger.error("Update staff error:", error);
    res.status(500).json({ success: false, message: "Failed to update staff" });
  }
};

export const deleteStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const staffId = parseInt(id);

    if (isNaN(staffId)) {
      res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
      return;
    }

    await prisma.user.delete({
      where: { user_id: staffId },
    });

    res.json({
      success: true,
      message: "Staff deleted successfully",
    });
  } catch (error) {
    logger.error("Delete staff error:", error);
    res.status(500).json({ success: false, message: "Failed to delete staff" });
  }
};

// Session Management
export const getAllSessions = async (_req: AuthRequest, res: Response) => {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    logger.error("Get all sessions error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch sessions" });
  }
};

export const deleteSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
      return;
    }

    const deletedSession = await prisma.session.delete({
      where: { id },
      include: {
        user: {
          select: {
            full_name: true,
            email: true,
          },
        },
      },
    });

    logger.info(`Session deleted: ${deletedSession.id} for user ${deletedSession.user.full_name}`);
const data={...deletedSession,success:true}
    res.json({
      success: true,
      message: "Session deleted successfully",
      data: data,
    });
  } catch (error) {
    logger.error("Delete session error:", error);
    res.status(500).json({ success: false, message: "Failed to delete session" });
  }
};

export const deleteAllSessions = async (_req: AuthRequest, res: Response) => {
  try {
    const deletedSessions = await prisma.session.deleteMany({});

    logger.info(`All sessions deleted. Count: ${deletedSessions.count}`);

    res.json({
      success: true,
      message: `All sessions deleted successfully. ${deletedSessions.count} sessions terminated.`,
      data: { deletedCount: deletedSessions.count },
    });
  } catch (error) {
    logger.error("Delete all sessions error:", error);
    res.status(500).json({ success: false, message: "Failed to delete all sessions" });
  }
};

// Admin Settings
export const getAdminSettings = async (res: Response) => {
  try {
    // Return system settings (can be stored in database or config)
    const settings = {
      siteName: "AVP Academy",
      maxVideoDownloads: 5,
      videoExpiryDays: 7,
      negativeMarkingEnabled: true,
      sessionTimeout: 30, // minutes
      maxConcurrentSessions: 1,
    };

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error("Get admin settings error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch settings" });
  }
};
