import { db } from "./db";
import { 
  leads, 
  projects, 
  jobs, 
  proposals, 
  communicationLogs, 
  customerInteractions, 
  leadMetrics, 
  projectMetrics, 
  salesMetrics, 
  pipelineAnalytics,
  quoteRequests,
  projectUpdates,
  users
} from "@shared/schema";
import { eq, sql, and, desc, asc } from "drizzle-orm";

export class CRMSyncService {
  /**
   * Convert lead to project and sync all related data
   */
  async convertLeadToProject(leadId: number, projectData: any) {
    const lead = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead.length) throw new Error("Lead not found");

    const leadData = lead[0];

    // Create project with lead data
    const [project] = await db.insert(projects).values({
      title: `${leadData.firstName} ${leadData.lastName} - ${projectData.serviceType}`,
      description: projectData.description || `Project converted from lead #${leadId}`,
      serviceType: projectData.serviceType,
      status: "new_lead",
      priority: projectData.priority || "medium",
      clientId: leadId,
      assignedTo: leadData.assignedToId,
      estimatedCost: leadData.estimatedValue?.toString(),
      email: leadData.email,
      phone: leadData.phone,
      address: leadData.address,
      ...projectData
    }).returning();

    // Update lead status
    await db.update(leads)
      .set({ status: "won", updatedAt: new Date() })
      .where(eq(leads.id, leadId));

    // Create customer interaction record
    await this.logCustomerInteraction({
      customerId: leadId,
      customerType: "lead",
      interactionType: "project_conversion",
      subject: "Lead converted to project",
      description: `Lead #${leadId} successfully converted to project #${project.id}`,
      outcome: "closed_deal",
      performedBy: leadData.assignedToId,
      relatedProjectId: project.id
    });

    // Update lead metrics
    await this.updateLeadMetrics(leadId);

    // Create initial project metrics
    await this.initializeProjectMetrics(project.id, leadData.source);

    return project;
  }

  /**
   * Sync quote request to project
   */
  async convertQuoteToProject(quoteId: number) {
    const quote = await db.select().from(quoteRequests).where(eq(quoteRequests.id, quoteId)).limit(1);
    if (!quote.length) throw new Error("Quote not found");

    const quoteData = quote[0];

    // Create project from quote
    const [project] = await db.insert(projects).values({
      title: `${quoteData.customerName} - Windows/Doors Project`,
      description: `Project created from quote #${quoteData.quoteNumber}`,
      serviceType: "windows", // Based on quote items
      status: "signed",
      priority: quoteData.priority,
      assignedTo: quoteData.assignedTo,
      estimatedCost: quoteData.totalEstimate,
      email: quoteData.customerEmail,
      phone: quoteData.customerPhone,
      address: quoteData.projectAddress,
    }).returning();

    // Update quote with project reference
    await db.update(quoteRequests)
      .set({ 
        convertedToProjectId: project.id,
        status: "converted",
        updatedAt: new Date()
      })
      .where(eq(quoteRequests.id, quoteId));

    // Log interaction
    await this.logCustomerInteraction({
      customerId: project.id,
      customerType: "customer",
      interactionType: "quote_conversion",
      subject: "Quote converted to project",
      description: `Quote #${quoteData.quoteNumber} converted to project #${project.id}`,
      outcome: "closed_deal",
      performedBy: quoteData.assignedTo,
      relatedProjectId: project.id,
      relatedQuoteId: quoteId
    });

    return project;
  }

  /**
   * Log customer interaction with automatic relationship linking
   */
  async logCustomerInteraction(interactionData: any) {
    return await db.insert(customerInteractions).values({
      ...interactionData,
      createdAt: new Date()
    }).returning();
  }

  /**
   * Sync communication across all platforms
   */
  async syncCommunication(communicationData: {
    type: 'call' | 'sms' | 'email';
    direction: 'inbound' | 'outbound';
    content?: string;
    phoneNumber?: string;
    emailAddress?: string;
    duration?: number;
    userId: number;
    leadId?: number;
    jobId?: number;
    metadata?: any;
  }) {
    // Log communication
    const [communication] = await db.insert(communicationLogs).values({
      ...communicationData,
      createdAt: new Date()
    }).returning();

    // Create customer interaction
    await this.logCustomerInteraction({
      customerId: communicationData.leadId,
      customerType: "lead",
      interactionType: communicationData.type,
      subject: `${communicationData.type.toUpperCase()} ${communicationData.direction}`,
      description: communicationData.content || `${communicationData.type} communication`,
      performedBy: communicationData.userId,
      metadata: {
        communicationId: communication.id,
        ...communicationData.metadata
      }
    });

    // Update lead/job metrics
    if (communicationData.leadId) {
      await this.updateLeadMetrics(communicationData.leadId);
    }

    return communication;
  }

  /**
   * Update lead metrics with latest data
   */
  async updateLeadMetrics(leadId: number) {
    // Get lead data
    const lead = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead.length) return;

    // Count communications
    const [commCount] = await db.select({ 
      count: sql<number>`count(*)` 
    }).from(communicationLogs).where(eq(communicationLogs.leadId, leadId));

    // Count proposals
    const [propCount] = await db.select({ 
      sent: sql<number>`count(*)`,
      accepted: sql<number>`count(*) filter (where status = 'approved')`
    }).from(proposals).where(eq(proposals.leadId, leadId));

    // Check if converted
    const [project] = await db.select().from(projects).where(eq(projects.clientId, leadId)).limit(1);
    
    const timeToConversion = project && lead[0].createdAt ? 
      Math.ceil((new Date(project.createdAt).getTime() - new Date(lead[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 
      null;

    // Upsert metrics
    const metricsData = {
      leadId,
      source: lead[0].source,
      conversionRate: project ? "100.00" : "0.00",
      timeToConversion,
      totalValue: project ? project.estimatedCost : null,
      communicationCount: commCount.count,
      proposalsSent: propCount.sent,
      proposalsAccepted: propCount.accepted,
      updatedAt: new Date()
    };

    await db.insert(leadMetrics).values(metricsData)
      .onConflictDoUpdate({
        target: leadMetrics.leadId,
        set: metricsData
      });
  }

  /**
   * Initialize project metrics
   */
  async initializeProjectMetrics(projectId: number, leadSource?: string) {
    await db.insert(projectMetrics).values({
      projectId,
      leadSource: leadSource || "unknown",
      createdAt: new Date()
    });
  }

  /**
   * Update project status and sync across all systems
   */
  async updateProjectStatus(projectId: number, newStatus: string, userId: number, notes?: string) {
    // Update project
    await db.update(projects)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(projects.id, projectId));

    // Log project update
    await db.insert(projectUpdates).values({
      projectId,
      userId,
      message: notes || `Project status updated to ${newStatus}`,
      type: "status_change",
      metadata: { oldStatus: newStatus, newStatus }
    });

    // Get project data
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    
    // Log customer interaction
    if (project) {
      await this.logCustomerInteraction({
        customerId: project.clientId,
        customerType: "customer",
        interactionType: "project_update",
        subject: `Project status updated to ${newStatus}`,
        description: notes || `Project #${projectId} status changed`,
        performedBy: userId,
        relatedProjectId: projectId
      });
    }

    // Update pipeline analytics
    await this.updatePipelineAnalytics();
  }

  /**
   * Sync job scheduling with project management
   */
  async syncJobWithProject(jobData: any) {
    const [job] = await db.insert(jobs).values(jobData).returning();

    // If job has project, update project status
    if (job.projectId) {
      await this.updateProjectStatus(job.projectId, "scheduled", jobData.assignedToId, 
        `Job scheduled: ${job.jobName}`);
    }

    // Log interaction
    if (job.customerId) {
      await this.logCustomerInteraction({
        customerId: job.customerId,
        customerType: "lead",
        interactionType: "meeting",
        subject: `Job scheduled: ${job.jobName}`,
        description: `Job #${job.id} scheduled for ${job.shiftStartDate}`,
        performedBy: jobData.assignedToId,
        relatedJobId: job.id,
        relatedProjectId: job.projectId
      });
    }

    return job;
  }

  /**
   * Generate comprehensive analytics dashboard data
   */
  async getAnalyticsDashboard(userId?: number, dateRange?: { start: Date; end: Date }) {
    const whereClause = userId ? eq(users.id, userId) : sql`true`;
    const dateFilter = dateRange ? 
      sql`created_at >= ${dateRange.start} AND created_at <= ${dateRange.end}` : 
      sql`true`;

    // Lead analytics
    const leadStats = await db.select({
      total: sql<number>`count(*)`,
      new: sql<number>`count(*) filter (where status = 'new')`,
      contacted: sql<number>`count(*) filter (where status = 'contacted')`,
      converted: sql<number>`count(*) filter (where status = 'won')`,
      avgValue: sql<number>`avg(estimated_value)`,
      totalValue: sql<number>`sum(estimated_value)`
    }).from(leads).where(dateFilter);

    // Project analytics
    const projectStats = await db.select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where status in ('in_progress', 'scheduled'))`,
      completed: sql<number>`count(*) filter (where status = 'completed')`,
      avgCost: sql<number>`avg(cast(estimated_cost as decimal))`,
      totalRevenue: sql<number>`sum(cast(estimated_cost as decimal))`
    }).from(projects).where(dateFilter);

    // Communication analytics
    const commStats = await db.select({
      total: sql<number>`count(*)`,
      calls: sql<number>`count(*) filter (where type = 'call')`,
      emails: sql<number>`count(*) filter (where type = 'email')`,
      sms: sql<number>`count(*) filter (where type = 'sms')`,
      avgDuration: sql<number>`avg(duration_seconds) filter (where type = 'call')`
    }).from(communicationLogs).where(dateFilter);

    // Pipeline conversion rates
    const pipelineStats = await db.select({
      stage: pipelineAnalytics.stage,
      count: pipelineAnalytics.projectCount,
      value: pipelineAnalytics.totalValue,
      conversionRate: pipelineAnalytics.conversionRate
    }).from(pipelineAnalytics)
    .orderBy(desc(pipelineAnalytics.date))
    .limit(50);

    return {
      leads: leadStats[0],
      projects: projectStats[0],
      communications: commStats[0],
      pipeline: pipelineStats,
      summary: {
        conversionRate: leadStats[0].total > 0 ? 
          (leadStats[0].converted / leadStats[0].total * 100).toFixed(2) : "0",
        avgDealSize: projectStats[0].avgCost,
        totalRevenue: projectStats[0].totalRevenue
      }
    };
  }

  /**
   * Update pipeline analytics
   */
  async updatePipelineAnalytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get current project counts by status
    const statusCounts = await db.select({
      status: projects.status,
      count: sql<number>`count(*)`,
      totalValue: sql<number>`sum(cast(estimated_cost as decimal))`
    }).from(projects)
    .groupBy(projects.status);

    // Update analytics for each status
    for (const stat of statusCounts) {
      await db.insert(pipelineAnalytics).values({
        stage: stat.status,
        date: today,
        projectCount: stat.count,
        totalValue: stat.totalValue?.toString() || "0",
        createdAt: new Date()
      }).onConflictDoUpdate({
        target: [pipelineAnalytics.stage, pipelineAnalytics.date],
        set: {
          projectCount: stat.count,
          totalValue: stat.totalValue?.toString() || "0"
        }
      });
    }
  }

  /**
   * Get customer 360 view - complete customer history
   */
  async getCustomer360(customerId: number, customerType: 'lead' | 'customer' = 'lead') {
    let customerData;
    
    if (customerType === 'lead') {
      [customerData] = await db.select().from(leads).where(eq(leads.id, customerId));
    }

    // Get all interactions
    const interactions = await db.select({
      id: customerInteractions.id,
      type: customerInteractions.interactionType,
      subject: customerInteractions.subject,
      description: customerInteractions.description,
      outcome: customerInteractions.outcome,
      createdAt: customerInteractions.createdAt,
      performedBy: users.username
    }).from(customerInteractions)
    .leftJoin(users, eq(customerInteractions.performedBy, users.id))
    .where(and(
      eq(customerInteractions.customerId, customerId),
      eq(customerInteractions.customerType, customerType)
    ))
    .orderBy(desc(customerInteractions.createdAt));

    // Get communications
    const communications = await db.select().from(communicationLogs)
      .where(eq(communicationLogs.leadId, customerId))
      .orderBy(desc(communicationLogs.createdAt));

    // Get projects
    const customerProjects = await db.select().from(projects)
      .where(eq(projects.clientId, customerId))
      .orderBy(desc(projects.createdAt));

    // Get proposals
    const customerProposals = await db.select().from(proposals)
      .where(eq(proposals.leadId, customerId))
      .orderBy(desc(proposals.createdAt));

    // Get metrics
    const [metrics] = await db.select().from(leadMetrics)
      .where(eq(leadMetrics.leadId, customerId));

    return {
      customer: customerData,
      interactions,
      communications,
      projects: customerProjects,
      proposals: customerProposals,
      metrics,
      timeline: [...interactions, ...communications].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    };
  }
}

export const crmSync = new CRMSyncService();