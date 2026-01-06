import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Contact } from './Contact';

/**
 * Tag Model
 * Categories/Labels for Contacts
 */
@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ default: 'blue' })
  color: string; // blue, red, green, yellow, purple, gray

  @ManyToMany(() => Contact, (contact) => contact.tags)
  contacts: Contact[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
