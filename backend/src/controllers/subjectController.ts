import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getSubjects = async (_req: Request, res: Response) => {
  console.log('[ROUTE HIT] GET /api/subjects');
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        courses: {
          select: {
            course_id: true,
            name: true
          }
        }
      }
    });
    const datadata=subjects.reverse()
    res.json({ data: datadata });
  } catch (error) {
    console.error('[ERROR] GET /api/subjects', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
};

export const getSubject = async (req: Request, res: Response) => {
  console.log('[ROUTE HIT] GET /api/subjects/:id', req.params.id);
  try {
    const subject = await prisma.subject.findUnique({
      where: { subject_id: Number(req.params.id) },
    });
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    return res.json({ data: subject });
  } catch (error) {
    console.error('[ERROR] GET /api/subjects/:id', error);
    return res.status(500).json({ error: 'Failed to fetch subject' });
  }
};

export const createSubject = async (req: Request, res: Response) => {
  console.log('[ROUTE HIT] POST /api/subjects', req.body);
  try {
    const { name, description, course_id } = req.body;
    
    const subjectData: any = {
      name, 
      description
    };

    // If course_id is provided, create the subject and connect it to the course
    if (course_id) {
      subjectData.courses = {
        connect: { course_id: parseInt(course_id) }
      };
    }

    const subject = await prisma.subject.create({
      data: subjectData,
      include: {
        courses: true
      }
    });
    
    res.status(201).json({ data: subject });
  } catch (error) {
    console.error('[ERROR] POST /api/subjects', error);
    res.status(500).json({ error: 'Failed to create subject' });
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  console.log('[ROUTE HIT] PUT /api/subjects/:id', req.params.id, req.body);
  try {
    const { name, description, course_id } = req.body;
    
    const subjectData: any = {
      name, 
      description
    };

    // If course_id is provided, update the course connection
    if (course_id) {
      subjectData.courses = {
        set: [{ course_id: parseInt(course_id) }]
      };
    }

    const subject = await prisma.subject.update({
      where: { subject_id: Number(req.params.id) },
      data: subjectData,
      include: {
        courses: true
      }
    });
    res.json({ data: subject });
  } catch (error) {
    console.error('[ERROR] PUT /api/subjects/:id', error);
    res.status(500).json({ error: 'Failed to update subject' });
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  console.log('[ROUTE HIT] DELETE /api/subjects/:id', req.params.id);
  try {
    await prisma.subject.delete({
      where: { subject_id: Number(req.params.id) },
    });
    res.status(204).end();
  } catch (error) {
    console.error('[ERROR] DELETE /api/subjects/:id', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
};

export const getCoursesForSubject = async (req: Request, res: Response) => {
  try {
    const subjectId = Number(req.params.id);
    if (isNaN(subjectId)) {
      return res.status(400).json({ error: 'Invalid subject ID' });
    }
    const subject = await prisma.subject.findUnique({
      where: { subject_id: subjectId },
      include: { courses: { select: { course_id: true, name: true } } }
    }) as any; // Type assertion to allow access to 'courses'
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    return res.json({ data: subject.courses });
  } catch (error) {
    console.error('[ERROR] GET /api/subjects/:id/courses', error);
    return res.status(500).json({ error: 'Failed to fetch courses for subject' });
  }
};

export const getSubjectsByCourse = async (req: Request, res: Response) => {
  try {
    const courseId = Number(req.params.courseId);
    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const subjects = await prisma.subject.findMany({
      where: {
        courses: {
          some: {
            course_id: courseId
          }
        }
      },
      include: {
        courses: {
          where: {
            course_id: courseId
          },
          select: {
            course_id: true,
            name: true
          }
        }
      }
    });

    return res.json({ data: subjects });
  } catch (error) {
    console.error('[ERROR] GET /api/subjects/course/:courseId', error);
    return res.status(500).json({ error: 'Failed to fetch subjects for course' });
  }
}; 